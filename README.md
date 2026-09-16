# HALTLAYER

### Autonomous Emergency Circuit-Breaker for Agentic Protocols

[![GenLayer Studio Next](https://img.shields.io/badge/GenLayer-Studio_Next_61997-00F0A8?style=flat-square)](https://studio-next.genlayer.com)
[![GenVM Python](https://img.shields.io/badge/GenVM-Python_3.12-00D8FF?style=flat-square)](https://docs.genlayer.com)
[![Direct Tests](https://img.shields.io/badge/Tests-17%2F17_Passing-brightgreen?style=flat-square)](tests/direct/)
[![GenVM Lint](https://img.shields.io/badge/GenVM--Lint-Passed-success?style=flat-square)](contracts/)
[![Live Demo](https://img.shields.io/badge/Live_Console-haltlayer.vercel.app-blueviolet?style=flat-square)](https://haltlayer.vercel.app)
[![Hackathon](https://img.shields.io/badge/Hackathon-GenLayer_Agent_Tank-orange?style=flat-square)](https://genlayer.com)

**Live Demo Application:** [https://haltlayer.vercel.app](https://haltlayer.vercel.app)  
**Target GitHub Repository:** [https://github.com/JimmyOgb/HaltLayer](https://github.com/JimmyOgb/HaltLayer)  
**GenLayer Studio Next Explorer:** [https://explorer-studio-dev.genlayer.com/](https://explorer-studio-dev.genlayer.com/)  
**StudioNet Explorer (Historical Fallback):** [https://genlayer-explorer.vercel.app](https://genlayer-explorer.vercel.app)

---

## 1. What is HaltLayer?

**HaltLayer** is an autonomous emergency circuit-breaker protocol built as an Intelligent Contract on the GenLayer blockchain. It bridges subjective real-world threat telemetry with deterministic, decentralized on-chain safety interventions.

In the emerging agentic economy, autonomous protocols, automated vaults, and lending markets execute transactions 24/7 without human intervention. When a critical vulnerability or exploit occurs (such as recursive reentrancy, oracle arbitrage, or flash-loan reserve drains), funds can be siphoned in seconds. 

HaltLayer sits directly between **threat detection** and **protocol execution**. When an exploit is detected, anyone—including autonomous monitoring agents, MEV searchers, white-hat researchers, or users—can submit verifiable evidence. Using GenLayer's nondeterministic execution and the **Equivalence Principle**, validator consensus evaluates the evidence against the target protocol's registered safety policy. If a genuine threat is substantiated, HaltLayer executes an immediate cross-contract emergency pause on the protected protocol.

---

## 2. The Core Idea: The Autonomous Defense Pipeline

HaltLayer establishes an autonomous 5-stage defensive lifecycle:

```text
    [ OBSERVE ]
         │  Threat signal & transaction hashes submitted permissionlessly
         ▼
  [ INVESTIGATE ]
         │  Leader retrieves external forensic telemetry & runs LLM reasoning
         ▼
[ VALIDATOR CONSENSUS ]
         │  Multi-validator verification enforces Equivalence Principle invariants
         ▼
[ POLICY ADJUDICATION ]
         │  Does evidence satisfy target match, danger score, and quality floor?
        ╱ ╲
       YES NO
      ╱     ╲
     ▼       ▼
[ INTERVENE ] [ REJECT ]
     │               │
     │ pause() hook  │ No action taken
     ▼               ▼
 [ PROTECTED ]   [ ACTIVE ]
```

1. **OBSERVE**: Anomaly markers (affected target protocol, transaction hashes, forensic report URLs) are submitted via `submit_incident()`.
2. **INVESTIGATE**: The GenLayer leader node nondeterministically retrieves external evidence (`gl.nondet.web.get`) and prompts an LLM with the protocol's strict safety policy (`gl.nondet.exec_prompt`).
3. **VALIDATOR CONSENSUS**: Independent validators deterministically verify that the leader's threat classification satisfies target matching, danger thresholds, and exploit pattern heuristics (`validator_fn`).
4. **POLICY ADJUDICATION**: The protocol evaluates the consensus determination:
   - **Weak / Unsubstantiated Evidence** $\rightarrow$ `REJECTED` (Target protocol remains `ACTIVE`).
   - **Strong / Verified Threat** $\rightarrow$ `HALT_ACCEPTED` (Target protocol transitions to `HALTED`).
5. **PROTECT**: On `HALT_ACCEPTED`, HaltLayer immediately emits a cross-contract message to the target contract's authorized circuit-breaker hook (`pause()`), halting malicious withdrawals while preserving legitimate user balances.

---

## 3. Why This Matters: The Web3 Emergency Response Gap

Autonomous DeFi protocols manage massive capital pools, yet their security relies on human emergency responses:

* **Exploits occur in seconds**: Attackers drain reserves within 1 to 3 blocks.
* **Multisigs are too slow**: Gathering 3-of-5 or 4-of-7 geographical signers typically requires 30 to 180 minutes.
* **Centralized pause bots create attack surfaces**: Single-key emergency bots introduce centralization risks and can be compromised or hijacked to grief protocols.

HaltLayer resolves this paradox by moving emergency judgment **directly into decentralized smart contracts**. It eliminates single-operator pause keys while maintaining strict protection against false-positive halts.

---

## 4. How It Works: Contract Mechanics

### Deterministic Incident Identifiers
Incident IDs are generated deterministically by the smart contract state:
```python
new_count = int(self.incident_counter) + 1
self.incident_counter = u32(new_count)
incident_id = "INC-" + str(new_count)
```

### Safety Policy Registration
Protocols register with an explicit safety boundary:
```python
register_protocol(
    target="0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B",
    name="DemoVault",
    authorized_halt_capability="HALT",
    min_evidence_quality="strong"
)
```

### Evidence Quality Hierarchy
* **`strong` (Level 3)**: Independent forensic report with matching target address, verified exploit trace, and critical vulnerability classification.
* **`moderate` (Level 2)**: Anomalous telemetry or preliminary security alerts without full exploit traces.
* **`weak` (Level 1)**: Vague claims, unverified forum rumors, or self-referential bulletins.

### Equivalence Principle Invariants
The validator consensus enforces:
1. `target_match == True`
2. `danger == True`
3. `rec_action == authorized_halt_capability`
4. `actual_evidence_level >= required_evidence_level` (`strong >= strong`)
5. `severity in ("critical", "high")`
6. Substantive exploit indicator heuristics (`_has_exploit_indicators`)

### Direct Cross-Contract Intervention
When `adjudicate_incident` resolves to `HALT_ACCEPTED`, the cross-contract call is triggered directly in the same finalized state transition:
```python
target_contract = gl.get_contract_at(target_addr)
target_contract.emit(on="accepted").pause()
```
No secondary transaction or off-chain relayer is required.

---

## 5. Safety Model: Defense Against Griefing & Insufficient Evidence

HaltLayer does **NOT** blindly halt protocols on every submission. It applies strict policy validation:

| Scenario | Evidence Submitted | Consensus Determination | Protocol Action | Final Vault State |
| :--- | :--- | :--- | :--- | :--- |
| **Unverified Forum Rumor** | Third-party forum post without trace | `REJECTED` (Weak evidence) | `NO_ACTION` | **`ACTIVE`** (`is_paused: false`) |
| **Self-Authored Text Bulletin** | Text advisory lacking independent telemetry | `REJECTED` (Self-referential) | `NO_ACTION` | **`ACTIVE`** (`is_paused: false`) |
| **Verified Critical Threat** | Structured forensic audit + matching trace | `HALT_ACCEPTED` (Strong) | Cross-Contract `pause()` | **`HALTED`** (`is_paused: true`) |

---

## 6. Live Deployments & On-Chain Verification

### 6.1 Active Deployment: GenLayer Studio Next (`Chain ID: 61997` / `0xf22d`)

HaltLayer and DemoVault are actively deployed and verified on **GenLayer Studio Next** (GenVM v0.3.0):

* **Network**: Studio Next
* **Chain ID**: `61997` (`0xf22d`)
* **RPC Endpoint**: `https://studio-next.genlayer.com/api`
* **Block Explorer**: [https://explorer-studio-dev.genlayer.com/](https://explorer-studio-dev.genlayer.com/)
* **HaltLayer Intelligent Contract**: [`0x178D62fB059467545b0b3059C8A1A83C98E0b45E`](https://explorer-studio-dev.genlayer.com/address/0x178D62fB059467545b0b3059C8A1A83C98E0b45E)
  - Deployment Tx: `0x0ac5de8a7c7b8837187b3b201abc997d9aebf87a8449e9dbc03a1157f661c6d1`
* **DemoVault Intelligent Contract**: [`0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0`](https://explorer-studio-dev.genlayer.com/address/0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0)
  - Deployment Tx: `0x7c0abb047af72122cf0c65a159e84712c6b15624dbdb419e634fec27d71040d2`
* **Deployer / Admin Address**: `0x2550Eb9B2CE5019CB4e14E6cB8BdB4d7d62F11a2`

#### Controlled Studio Next Live Test Runs

##### Negative Control — Incident `INC-1` (`[INC-LIVE-NEGATIVE-NEXT]`)
* **Evidence**: Unverified social post without trace or transaction hashes.
* **Submission Tx**: `0x6a655a8fdf116435474cb108ce3ed0c3319ff9cd823e2792b1b5c0b78e8316f9`
* **Adjudication Tx**: `0x96bdb3f80376ba50d5ab44d4571258ae3c9dc351de04066d13d751721e624b82`
* **Consensus Outcome**: `ACCEPTED` (GenLayer validator consensus confirmed)
* **Final Incident State**: `REJECTED` (`threat_severity: none`, `evidence_quality: weak`, `recommended_action: NO_ACTION`)
* **Protection Status**: **`ACTIVE`**
* **DemoVault Pause Read**: **`false`** (Protocol remained safely unpaused; false-positive griefing rejected).

##### Positive Control — Incident `INC-2` (`[INC-LIVE-POSITIVE-NEXT]`)
* **Evidence**: Structured forensic audit telemetry citing recursive reentrancy exploit on DemoVault reserves.
* **Submission Tx**: `0x497b1f2d9b76ee7618877cadfcd50b3cf82e90d5fe506b24cb27953e24d8b92b`
* **Adjudication Tx**: `0x80e2ae3ee239aeac329e947a83a6555d15b53879d663973e526e618a27681f02`
* **Consensus Outcome**: `ACCEPTED` (GenLayer validator consensus confirmed)
* **Final Incident State**: `HALT_ACCEPTED` (`threat_severity: critical`, `evidence_quality: strong`, `recommended_action: HALT`)
* **Protection Status**: **`HALTED`**
* **DemoVault Pause Read**: **`true`** (Emergency circuit breaker tripped on-chain!).

> **Important Disclosure**: `INC-2` was executed as a controlled positive-control forensic scenario to rigorously prove the on-chain halt path on Studio Next. It is not an active adversarial exploit in the wild.

---

### 6.2 Historical Fallback: GenLayer StudioNet (`Chain ID: 61999` / `0xf22f`)

Preserved as a historical fallback per hackathon migration rules:

* **Network**: StudioNet (Legacy Fallback)
* **Chain ID**: `61999` (`0xf22f`)
* **RPC Endpoint**: `https://studio.genlayer.com/api`
* **Block Explorer**: [https://genlayer-explorer.vercel.app](https://genlayer-explorer.vercel.app)
* **HaltLayer Intelligent Contract**: `0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23`
* **DemoVault Intelligent Contract**: `0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B`
* **Deployer / Admin Address**: `0xE4220c4b71877bb94EB173f467ef5c5557017085`
* **Verified Incidents**: `INC-3` (Negative control, rejected) and `INC-4` (Positive control, halt accepted)

---

## 7. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    External Monitoring                      │
│        Security Agent / Watchdog / Community Reporter       │
└──────────────────────────────┬──────────────────────────────┘
                               │ submit_incident(...)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               HaltLayer Intelligent Contract                │
│             0x178D...b45E (Studio Next, 61997)              │
├─────────────────────────────────────────────────────────────┤
│ 1. Leader Execution (gl.vm.run_nondet)                      │
│    - Fetches web telemetry (gl.nondet.web.get)              │
│    - Reasons over exploit criteria (gl.nondet.exec_prompt)  │
│ 2. Multi-Validator Verification                             │
│    - Evaluates Equivalence Principle invariants             │
│    - Checks policy boundaries & evidence floor              │
│ 3. Deterministic State Transition                           │
│    - Cross-contract protection check & pause enforcement    │
└──────────────────────────────┬──────────────────────────────┘
                               │ pause() / view check
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DemoVault Protected Protocol                │
│             0xE096...E3E0 (Studio Next, 61997)              │
├─────────────────────────────────────────────────────────────┤
│ - is_paused() == true                                       │
│ - Unauthorized withdrawals immediately REVERT               │
│ - Reserves locked and protected against exploit drain       │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Repository Structure

```text
HaltLayer/
├── contracts/
│   ├── demo_vault.py             # Protected vault with circuit-breaker interface
│   └── halt_layer.py             # Autonomous circuit-breaker intelligent contract
├── tests/
│   ├── direct/
│   │   ├── conftest.py           # Test configuration & direct mode harnesses
│   │   ├── test_demo_vault.py    # Target protocol unit tests (9 tests)
│   │   └── test_halt_layer.py    # Circuit-breaker unit tests (8 tests)
│   └── integration/
│       └── test_full_circuit.py  # End-to-end integration scenario
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Next.js root layout & metadata
│   │   │   ├── page.tsx          # Main security console interface
│   │   │   ├── api/rpc/route.ts  # StudioNet RPC proxy (zero CORS / zero client leaks)
│   │   │   └── api/tx/route.ts   # Secure transaction dispatcher route
│   │   ├── components/           # UI components, modals, and monitors
│   │   └── lib/                  # GenLayer contract clients, codec, & context
│   ├── public/                   # SVGs, security bulletins, and audit fixtures
│   ├── package.json              # Frontend dependencies (Next.js 14, Tailwind)
│   ├── tsconfig.json             # TypeScript configuration
│   └── vercel.json               # Vercel deployment specification
├── scripts/
│   └── demo_flow.py              # Automated deployment & test demonstration script
├── docs/
│   └── architecture.md           # Deep-dive architecture & state machine specification
├── gltest.config.yaml            # GenLayer testing network configuration
├── DEMO.md                       # Presentation & demonstration script
└── README.md                     # Comprehensive project documentation
```

---

## 9. Smart Contracts

### [`contracts/demo_vault.py`](contracts/demo_vault.py)
* A sample lending reserve vault contract.
* Contains standard `deposit()` and `withdraw()` functionality.
* Implements `pause()`, `resume()`, and `activate_safe_mode()` protected by an authorized `circuit_breaker` address.
* While paused, all withdrawal transactions immediately revert with `UserError("Vault is paused: withdrawals disabled")`.

### [`contracts/halt_layer.py`](contracts/halt_layer.py)
* The autonomous emergency circuit-breaker contract.
* Manages protocol registration, safety policies, and evidence thresholds.
* Orchestrates non-deterministic threat evaluation via `gl.vm.run_nondet()`.
* Automatically invokes cross-contract hooks on target protocols upon confirmed consensus.
* Includes a decentralized appeal workflow (`appeal_incident()` / `resolve_appeal()`).

---

## 10. Frontend Application

The frontend is built with **Next.js 14**, **React 18**, **Tailwind CSS**, and custom GenLayer contract codecs:

* **Production URL**: [https://haltlayer.vercel.app](https://haltlayer.vercel.app)
* **Live On-Chain Polling**: Periodically queries StudioNet contracts to display live protocol states, incident feeds, and vault balances.
* **RPC Proxy Route (`/api/rpc`)**: Routes requests to `https://studio.genlayer.com/api` server-side, preventing browser CORS errors.
* **Dual Dispatcher (`/api/tx`)**: Supports direct browser Web3 wallet signing as well as optional backend-sponsored transaction dispatching.
* **Bundle Security**: Zero private keys or relay secrets are embedded in client bundles.

---

## 11. Quick Start & Setup

### Prerequisites
* Python 3.12+
* Node.js 18+ and npm
* GenLayer CLI (`npm install -g genlayer`)

### 1. Clone the Repository
```bash
git clone https://github.com/JimmyOgb/HaltLayer.git
cd HaltLayer
```

### 2. Python Environment Setup
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install pytest genlayer-test genvm-linter
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 12. Running Tests & Verifications

### 1. Direct Mode Unit Tests (17/17 Passed)
```bash
pytest tests/direct/ -v
```
Output:
```text
============================= 17 passed in 3.75s ==============================
```

### 2. GenVM Contract Linting
```bash
python -X utf8 -m genvm_linter.cli contracts/demo_vault.py
python -X utf8 -m genvm_linter.cli contracts/halt_layer.py
```
Output:
```text
✓ Lint passed (3 checks)
✓ Lint passed (3 checks)
```

### 3. Frontend Lint, Typecheck, and Build
```bash
cd frontend
npm run lint         # ESLint: 0 warnings, 0 errors
npm run typecheck    # TypeScript compiler: passed cleanly
npm run build        # Next.js production build: 6/6 static & dynamic routes compiled
cd ..
```

---

## 13. Deployment Guide

### Deploying Contracts to Studio Next
```bash
# Using GenLayer CLI or Studio Next Web IDE
# RPC: https://studio-next.genlayer.com/api (Chain ID: 61997)

# 1. Deploy DemoVault
genlayer deploy contracts/demo_vault.py

# 2. Deploy HaltLayer
genlayer deploy contracts/halt_layer.py

# 3. Authorize Circuit Breaker on DemoVault
genlayer write <DEMO_VAULT_ADDRESS> set_circuit_breaker --args <HALT_LAYER_ADDRESS>

# 4. Register DemoVault in HaltLayer
genlayer write <HALT_LAYER_ADDRESS> register_protocol --args <DEMO_VAULT_ADDRESS> "DemoVault" "HALT" "strong"
```

### Deploying Frontend to Vercel
```bash
cd frontend
npm run build
vercel --prod --yes
```

---

## 14. Wallet Safety & Non-Custodial Transparency

HaltLayer is designed with a security-first, non-custodial architecture that prioritizes user safety and transparency:

### 1. Read-Only By Default
The entire HaltLayer application functions in **read-only mode** without connecting a Web3 wallet. Users and judges can freely inspect:
* Active contract states and reserve totals
* Incident ledger and consensus adjudication history
* Deployed contract addresses and verification records
* Live network connection and Studio Next telemetry

### 2. Wallet Connection Purpose
Connecting a browser wallet (e.g., MetaMask) is **strictly optional** and only required for user-authorized write operations:
* Submitting incident evidence reports (`submit_incident`)
* Triggering decentralized validator adjudication (`adjudicate_incident`)
* Submitting mitigation appeals (`appeal_incident` / `resolve_appeal`)
* Testing vault defense mechanisms (`deposit`, `withdraw`, `pause`, `resume`)

### 3. Pre-Signing Transaction Confirmation (Rule 13 Compliance)
Every state-modifying action requires explicit confirmation through a transparent review modal that displays:
* **Target Contract Address**: Allowlisted contract destination
* **Target Contract Name**: Human-readable protocol name
* **Network & Chain ID**: GenLayer Studio Next (Chain ID: `61997` / `0xf22d`)
* **Method Name**: Exact contract entry point being invoked
* **Human-Readable Purpose**: Clear explanation of the intended operation
* **Transaction Fee Policy**: Platform fee distribution policy (zero user token deduction)
* **Protocol State Impact**: Exact on-chain state transition effected

### 4. Zero Token Approvals & Non-Custodial Hygiene
* **No Token Approvals**: HaltLayer never requests `approve()`, `setApprovalForAll()`, `permit()`, or `permit2` signatures.
* **No Fund Transfers**: The dApp does not request or execute transfers of user ETH, GEN, or other digital assets.
* **No Private Keys**: Private keys, mnemonics, or seed phrases are never requested, stored, or transmitted.
* **Narrow Allowlisted Dispatcher**: The `/api/tx` endpoint only relays typed, allowlisted actions to verified contract targets.

### 5. Verified Deployment Addresses
* **Studio Next (Active Hackathon Target)**:
  * Network: Studio Next (`https://studio-next.genlayer.com/api`, Chain ID `61997` / `0xf22d`)
  * HaltLayer Contract: `0x178D62fB059467545b0b3059C8A1A83C98E0b45E`
  * DemoVault Contract: `0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0`
  * Explorer: `https://explorer-studio-dev.genlayer.com/`
* **StudioNet (Historical Fallback)**:
  * Network: StudioNet (`https://studio.genlayer.com/api`, Chain ID `61999` / `0xf22f`)
  * HaltLayer Contract: `0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23`
  * DemoVault Contract: `0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B`
  * Explorer: `https://genlayer-explorer.vercel.app`

### 6. Hackathon & Demo Limitations
* HaltLayer is an experimental prototype developed for the GenLayer Agent Tank Hackathon.
* Always connect using a dedicated test/burner wallet on GenLayer Studio Next. Never connect mainnet accounts holding real funds.

---

## 15. Security Considerations

1. **Strict Authorization**: Only the registered `circuit_breaker` contract address can trigger emergency pauses on protected protocols.
2. **Quality Threshold Enforcement**: The protocol owner sets `min_evidence_quality`. Unsubstantiated alerts cannot pause protocols.
3. **Decentralized Consensus**: Single nodes cannot manipulate outcomes; decisions require validator consensus.
4. **Client-Side Key Hygiene**: Frontend client bundles contain zero private keys.
5. **Hackathon Disclaimer**: HaltLayer is a prototype demonstration developed for the GenLayer Agent Tank Hackathon. It is not audited production security infrastructure.

---

## 16. Known Limitations

* **Controlled Fixture Evaluation**: Positive-control testing relies on controlled forensic evidence because clean testnet contracts lack active in-the-wild adversaries.
* **StudioNet Environment**: StudioNet is a testnet environment; validator performance and LLM inference latencies may vary based on testnet load.

---

## 17. Roadmap

* [ ] **Automated On-Chain Forensics**: Real-time automated transaction trace parsing natively in GenVM.
* [ ] **Multi-Protocol Router**: Centralized security router supporting tiered pause capabilities (e.g. rate-limiting, partial liquidation freeze).
* [ ] **Decentralized Watchdog Network**: Incentivized staking network for white-hat anomaly submitters with slashing for false reports.

---

## 18. Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/defense-enhancement`).
3. Commit your changes (`git commit -m 'feat: add enhanced forensic heuristic'`).
4. Ensure all tests and linters pass (`pytest tests/direct/ -v` and `npm run lint`).
5. Open a Pull Request.

---

## 19. License

No formal license was pre-existing in this repository. This software is provided as an open-source prototype for the GenLayer Agent Tank Hackathon. For commercial reuse or formal deployment licensing, please contact the repository owner.

---

## 20. Hackathon Track

* **Event**: GenLayer Agent Tank Hackathon (2026)
* **Track**: Autonomous Protocols
* **Runner**: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`
