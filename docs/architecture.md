# HaltLayer Architecture & Specification

## 1. Executive Summary

**HaltLayer** is an autonomous emergency circuit-breaker for Intelligent Contracts on the GenLayer blockchain, purpose-built for the **Autonomous Protocols** track.

Modern DeFi and autonomous smart contract protocols operate 24/7 without human intervention. When a protocol suffers an active exploit (e.g. reentrancy drain, oracle manipulation, infinite minting), catastrophic losses typically occur within minutes - far faster than human multisig signers or governance time-locks can respond.

HaltLayer leverages **GenLayer's nondeterministic execution** and the **Equivalence Principle** to enable autonomous, on-chain emergency response. Anyone - including autonomous monitoring agents, MEV bots, or white-hat security researchers - can submit verifiable exploit evidence. GenLayer validator consensus autonomously fetches external threat telemetry, executes an LLM reasoning model to analyze the attack pattern against the target protocol's safety policy, deterministically verifies the threat via consensus invariants, and immediately triggers an on-chain pause on the compromised protocol.

---

## 2. System Architecture

`
+-----------------------------------------------------------------------------------+
|                              EXTERNAL THREAT ACTORS                               |
|                  (Exploiter / Flashloan Attacker / Malicious Tx)                  |
+-----------------------------------------------------------------------------------+
                                         |  Attacks
                                         v
+-----------------------------------------------------------------------------------+
|                             PROTECTED PROTOCOL LAYER                              |
|                                                                                   |
|   DemoVault (Intelligent Contract)                                                |
|   - deposit(amount)                                                               |
|   - withdraw(amount)           <-- [BLOCKED WHEN PAUSED]                          |
|   - pause()                    <-- Authorized caller: HaltLayer                   |
|   - resume()                   <-- Authorized caller: HaltLayer or Owner           |
|   - activate_safe_mode()       <-- Authorized caller: HaltLayer                   |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | Emergency Pause/Resume Calls
                                         |
+----------------------------------------+------------------------------------------+
|                                HALTLAYER CORE                                     |
|                                                                                   |
|   HaltLayer (Intelligent Contract)                                                |
|   - register_protocol(target, name, capability, min_quality)                      |
|   - submit_incident(target, description, tx_hashes, evidence_urls)                |
|   - adjudicate_incident(incident_id)  <-- Uses gl.vm.run_nondet                   |
|   - appeal_incident(incident_id, appeal_reason)                                   |
|   - resolve_appeal(incident_id, resume_protocol, resolution_reason)               |
+-----------------------------------------------------------------------------------+
                                         |
                   gl.vm.run_nondet(leader_fn, validator_fn)
                                         |
       +---------------------------------+---------------------------------+
       v                                                                   v
+------------------------------+                       +------------------------------+
|       LEADER EXECUTION       |                       |    VALIDATOR VERIFICATION    |
|       (Nondeterministic)     |                       |     (Deterministic Checks)   |
+------------------------------+                       +------------------------------+
| 1. gl.nondet.web.get()       |                       | 1. Verify Return payload     |
|    Fetch external telemetry, |                       | 2. Check target_match == True|
|    exploit reports, API JSON |                       | 3. Check danger flag == True |
| 2. gl.nondet.exec_prompt()   |   Result: Calldata    | 4. Enforce protocol policy:  |
|    Prompt LLM with policy    | --------------------> |    - Capability boundary     |
|    and evidence context.     |                       |    - Evidence quality floor  |
|    Returns JSON schema.      |                       |    - Severity threshold      |
| 3. _normalize_assessment()   |                       | 5. Exploit pattern validation|
+------------------------------+                       +------------------------------+
                                                                   |
                                                Equivalence Principle Reached
                                                                   |
                                                                   v
                                                       Deterministic State Transition
                                                       (Protocol Marked HALTED)
`

---

## 3. Incident Lifecycle & State Machine

`
              +---------------+
              |   SUBMITTED   |  (Anyone submits evidence)
              +-------+-------+
                      |
                      | adjudicate_incident()
                      v
              +---------------+
              |  ADJUDICATING |  (GenVM Leader/Validator consensus)
              +-------+-------+
                      |
         +------------+------------+
         |                         |
         v                         v
+------------------+      +------------------+
|  HALT_ACCEPTED   |      |     REJECTED     |
| (Target HALTED)  |      |  (Target ACTIVE) |
+--------+---------+      +------------------+
         |
         | appeal_incident()
         v
+------------------+
|     APPEALED     |  (Target UNDER_INVESTIGATION)
+--------+---------+
         |
         | resolve_appeal()
         +-------------------------+
         v                         v
+------------------+      +------------------+
| RESOLVED_RESUME  |      |    FINAL_HALT    |
| (Target ACTIVE)  |      |  (Target HALTED) |
+------------------+      +------------------+
`

### Protocol Protection Statuses
* **ACTIVE**: Normal operational status. Protected contracts permit normal deposits, swaps, and withdrawals.
* **HALTED**: Emergency circuit breaker has tripped. Operations on protected protocol are blocked.
* **SAFE_MODE**: Degraded operational status. High-risk functions are restricted.
* **UNDER_INVESTIGATION**: An appeal has been submitted with counter-evidence and is pending council determination.

---

## 4. The Equivalence Principle & Consensus Safety

In GenLayer, smart contracts can incorporate external data and LLM reasoning through non-deterministic execution (gl.vm.run_nondet). However, validators cannot simply accept subjective output without consensus.

### Leader Function (leader_fn)
1. **External Web Ingestion**: Leader connects to external URLs (gl.nondet.web.get) to fetch JSON alerts, block explorer receipts, or incident reports.
2. **LLM Reasoning**: Invokes gl.nondet.exec_prompt with a strict JSON format prompt containing:
   - Protocol name and target address.
   - Authorized policy capabilities (HALT, SAFE_MODE, ALL).
   - Minimum evidence quality floor (strong, moderate, weak).
   - Incident description, malicious transaction hashes, and retrieved evidence.
3. **Normalization**: Parses and validates the returned JSON, guaranteeing mandatory fields:
   danger, severity, 
ecommended_action, vidence_quality, 	arget_match, and 
eason.

### Validator Function (alidator_fn)
Validators independently determine whether the Leader's proposed result satisfies the protocol's deterministic safety policy:
1. **Target Identity**: 	arget_match must be explicitly True.
2. **Danger Assessment**: danger flag must be True to authorize an emergency transition.
3. **Capability Boundary**: If the protocol only authorized SAFE_MODE, a leader recommendation of HALT is rejected.
4. **Evidence Quality Threshold**: Strong (3) >= Moderate (2) >= Weak (1). If the protocol requires strong evidence, lower tiers are rejected.
5. **Severity Threshold**: HALT requires critical or high severity.
6. **Corroborating Invariant Checks**: Independent parsing of description and tx hashes ensures presence of recognized exploit patterns (e.g. reentrancy, drain, exploit, attack, overflow, unauthorized).

### Strict State Mutation Invariant
In compliance with GenLayer contract standards, **zero state mutation occurs inside leader_fn or alidator_fn**. All storage mutations (self.incidents[...] = ..., self.protocols[...].status = ...) occur exclusively in deterministic write method execution *after* gl.vm.run_nondet returns.

---

## 5. Contract APIs

### HaltLayer (contracts/halt_layer.py)

| Method | Access | Description |
|---|---|---|
| `register_protocol(target, name, capability, min_quality)` | Protocol Owner | Registers or updates a protocol under HaltLayer protection |
| `submit_incident(target, description, tx_hashes, evidence_urls)` | Public | Submits exploit incident report with external evidence |
| `adjudicate_incident(incident_id)` | Public | Triggers nondeterministic consensus adjudication |
| `appeal_incident(incident_id, appeal_reason)` | Protocol Owner | Submits formal appeal against an accepted halt |
| `resolve_appeal(incident_id, resume_protocol, reason)` | Admin/Multisig | Adjudicates appeal to resume protocol or lock final halt |
| `get_protocol(target)` | View | Returns protocol registration metadata and status |
| `get_incident(incident_id)` | View | Returns incident report, evaluation results, and status |
| `get_protection_status(target)` | View | Returns protocol protection status string |
| `get_protocol_count()` | View | Returns total registered protocol count |
| `get_incident_count()` | View | Returns total submitted incident count |

### DemoVault (contracts/demo_vault.py)

| Method | Access | Description |
|---|---|---|
| `deposit(amount)` | Public | Deposits funds into vault (reverts if paused) |
| `withdraw(amount)` | Public | Withdraws funds from vault (reverts if paused) |
| `pause()` | Circuit Breaker / Owner | Halts all deposit and withdrawal operations |
| `resume()` | Circuit Breaker / Owner | Restores normal operations |
| `activate_safe_mode()` | Circuit Breaker / Owner | Switches vault to safe mode |
| `set_circuit_breaker(new_cb)` | Owner | Updates authorized circuit-breaker address |
| `get_balance(account)` | View | Returns account balance |
| `get_total_staked()` | View | Returns total deposits in vault |
| `is_paused()` | View | Returns boolean paused status |
| `get_circuit_breaker()` | View | Returns circuit breaker contract address |

---

## 6. Network Deployments

### Primary Target: GenLayer Studio Next
- **Chain ID**: `61997` (`0xf22d`)
- **RPC Endpoint**: `https://studio-next.genlayer.com/api`
- **Explorer**: `https://explorer-studio-dev.genlayer.com/`
- **HaltLayer**: `0x178D62fB059467545b0b3059C8A1A83C98E0b45E`
- **DemoVault**: `0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0`

### Preserved Fallback: GenLayer StudioNet
- **Chain ID**: `61999` (`0xf22f`)
- **RPC Endpoint**: `https://studio.genlayer.com/api`
- **Explorer**: `https://genlayer-explorer.vercel.app`
- **HaltLayer**: `0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23`
- **DemoVault**: `0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B`
