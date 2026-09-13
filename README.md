# HALTLAYER

### Autonomous Emergency Circuit-Breaker for Agentic Protocols

[![GenLayer StudioNet](https://img.shields.io/badge/GenLayer-StudioNet_61999-00F0A8?style=flat-square)](https://studio.genlayer.com)
[![GenVM Python](https://img.shields.io/badge/GenVM-Python_3.12-00D8FF?style=flat-square)](https://docs.genlayer.com)
[![Direct Tests](https://img.shields.io/badge/Tests-17%2F17_Passing-brightgreen?style=flat-square)](tests/direct/)
[![GenVM Lint](https://img.shields.io/badge/GenVM--Lint-Passed-success?style=flat-square)](contracts/)
[![Live Demo](https://img.shields.io/badge/Live_Console-haltlayer.vercel.app-blueviolet?style=flat-square)](https://haltlayer.vercel.app)
[![Hackathon](https://img.shields.io/badge/Hackathon-GenLayer_Agent_Tank-orange?style=flat-square)](https://genlayer.com)

**Live Demo Application:** [https://haltlayer.vercel.app](https://haltlayer.vercel.app)  
**Target GitHub Repository:** [https://github.com/JimmyOgb/HaltLayer](https://github.com/JimmyOgb/HaltLayer)  
**GenLayer StudioNet Explorer:** [https://genlayer-explorer.vercel.app](https://genlayer-explorer.vercel.app)

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

## 6. Live StudioNet Verification & Proof

HaltLayer and DemoVault are deployed and verified on **GenLayer StudioNet** (`Chain ID: 61999`):

* **DemoVault Intelligent Contract**: [`0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B`](https://genlayer-explorer.vercel.app)
* **HaltLayer Intelligent Contract**: [`0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23`](https://genlayer-explorer.vercel.app)
* **Deployer / Admin Address**: `0xE4220c4b71877bb94EB173f467ef5c5557017085`

### Circuit-Breaker Authorization Read
Direct read from DemoVault confirms HaltLayer is authorized:
```powershell
genlayer call 0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B get_circuit_breaker
# Returns: 0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23
```

### Controlled StudioNet Live Test Runs

#### Negative Control — Incident `INC-3` (`[INC-LIVE-NEGATIVE-1]`)
* **Evidence**: Unverified forum rumor with no transaction hashes.
* **Submission Tx**: `0xf7221236a36627e71ddc46e3ac188d6146d09c766d514818ebb427be047ba28e`
* **Adjudication Tx**: `0x8dad815647f8d6f97570ce04127f336452a82395dbfc695410464728f53ba1e7`
* **Consensus Outcome**: `ACCEPTED` (`MAJORITY_AGREE`, 1 round)
* **Final Incident State**: `REJECTED` (`evidence_quality: weak`, `recommended_action: NO_ACTION`)
* **DemoVault Pause Read**: **`false`** (Protocol remained safely unpaused).

#### Positive Control — Incident `INC-4` (`[INC-LIVE-POSITIVE-1]`)
* **Evidence**: Structured forensic audit citing recursive reentrancy exploit on DemoVault reserves.
* **Submission Tx**: `0x6ed474a169caa6946a48385bdfffc8d316fe00278ddc1cab7ceb6a152f91b872`
* **Adjudication Tx**: `0xb299fb3228bc83da8af001113f2be5e2b56b60060bf3a7114629cf8f8831cd2c`
* **Consensus Outcome**: `ACCEPTED` (`MAJORITY_AGREE`, 1 round)
* **Triggered Internal Message**: `0x0768753dcf7d74a0dfe3e966214b9789613e2cd28e988df7f4dd8a753d1bcfa1` (`method: pause`)
* **Final Incident State**: `HALT_ACCEPTED` (`threat_severity: critical`, `evidence_quality: strong`, `recommended_action: HALT`)
* **HaltLayer Protection Status**: **`HALTED`**
* **DemoVault Pause Read**: **`true`** (Emergency circuit breaker tripped on-chain).

> **Important Disclosure**: `INC-4` was executed as a controlled positive-control forensic scenario to rigorously prove the on-chain halt path on StudioNet. It is not an active adversarial exploit in the wild.

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
│                 0xB363...1A23 (StudioNet)                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Leader Execution (gl.vm.run_nondet)                      │
│    - Fetches web telemetry (gl.nondet.web.get)              │
│    - Reasons over exploit criteria (gl.nondet.exec_prompt)  │
│ 2. Multi-Validator Verification                             │
│    - Evaluates Equivalence Principle invariants             │
│    - Checks policy boundaries & evidence floor              │
│ 3. Deterministic State Transition                           │
│    - Emits cross-contract message if HALT_ACCEPTED          │
└──────────────────────────────┬──────────────────────────────┘
                               │ target_contract.pause()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DemoVault Protected Protocol                │
│                 0x76a3...3d1B (StudioNet)                   │
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

### Deploying Contracts to StudioNet
```bash
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
vercel --prod --yes
```

---

## 14. Security Considerations

1. **Strict Authorization**: Only the registered `circuit_breaker` contract address can trigger emergency pauses on protected protocols.
2. **Quality Threshold Enforcement**: The protocol owner sets `min_evidence_quality`. Unsubstantiated alerts cannot pause protocols.
3. **Decentralized Consensus**: Single nodes cannot manipulate outcomes; decisions require validator consensus.
4. **Client-Side Key Hygiene**: Frontend client bundles contain zero private keys.
5. **Hackathon Disclaimer**: HaltLayer is a prototype demonstration developed for the GenLayer Agent Tank Hackathon. It is not audited production security infrastructure.

---

## 15. Known Limitations

* **Controlled Fixture Evaluation**: Positive-control testing relies on controlled forensic evidence because clean testnet contracts lack active in-the-wild adversaries.
* **StudioNet Environment**: StudioNet is a testnet environment; validator performance and LLM inference latencies may vary based on testnet load.

---

## 16. Roadmap

* [ ] **Automated On-Chain Forensics**: Real-time automated transaction trace parsing natively in GenVM.
* [ ] **Multi-Protocol Router**: Centralized security router supporting tiered pause capabilities (e.g. rate-limiting, partial liquidation freeze).
* [ ] **Decentralized Watchdog Network**: Incentivized staking network for white-hat anomaly submitters with slashing for false reports.

---

## 17. Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/defense-enhancement`).
3. Commit your changes (`git commit -m 'feat: add enhanced forensic heuristic'`).
4. Ensure all tests and linters pass (`pytest tests/direct/ -v` and `npm run lint`).
5. Open a Pull Request.

---

## 18. License

No formal license was pre-existing in this repository. This software is provided as an open-source prototype for the GenLayer Agent Tank Hackathon. For commercial reuse or formal deployment licensing, please contact the repository owner.

---

## 19. Hackathon Track

* **Event**: GenLayer Agent Tank Hackathon (2026)
* **Track**: Autonomous Protocols
* **Runner**: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`
