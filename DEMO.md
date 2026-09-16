# HaltLayer Demo Script (60-90 Second Walkthrough)

This script provides the exact narrative, stage transitions, and commands for demonstrating HaltLayer during the GenLayer Agent Tank Hackathon judging.

---

## 1. Introduction (0:00 - 0:15)

- Hello judges. Autonomous DeFi protocols operate 24/7 with billions at risk, but their emergency defense still depends on slow, manual multisigs. When a protocol is attacked by a reentrancy exploit or oracle flash loan, human responders take over an hour to pause the contract - by then, the vault is empty.
- Today we present **HaltLayer**: a real, autonomous emergency circuit-breaker powered by GenLayer Intelligent Contracts and the Equivalence Principle.

---

## 2. The Setup and Deployment (0:15 - 0:30)

Show the terminal and execute:
```bash
python scripts/demo_flow.py
```

- Here we deploy DemoVault, a lending reserve holding ,000,000 USD, and register it with HaltLayer under an autonomous safety policy requiring strong evidence to trigger an immediate emergency HALT.

---

## 3. Incident Submission and Autonomous Consensus (0:30 - 0:55)

Point to the terminal output:
- An autonomous watchdog agent detects a recursive reentrancy drain and submits an incident report with transaction hashes and external threat alerts.
- Now watch GenLayer in action: HaltLayer executes gl.vm.run_nondet. The leader fetches external threat telemetry via gl.nondet.web.get and prompts an LLM with the protocol safety policy. GenLayer validators independently verify that the evidence meets the policy invariants under the Equivalence Principle.
- Consensus is reached: Threat confirmed. HaltLayer transitions to HALT_ACCEPTED and trips the circuit breaker on DemoVault.

---

## 4. Protection Verification (0:55 - 1:15)

Point to the blocked transaction in the terminal:
- Immediately, the attacker subsequent withdrawal transaction REVERTS on-chain with Vault is paused: withdrawals disabled. The remaining reserves are completely safe.

---

## 5. Appeal and Decentralized Governance (1:15 - 1:30)

Point to the appeal resolution:
- HaltLayer also prevents griefing or permanent lockouts. The protocol owner submits an appeal with counter-evidence and an audited patch. The security council approves the appeal, and DemoVault safely resumes normal operations.
- All 24 direct tests pass in under 30 seconds, both contracts pass genvm-lint with zero errors, and the entire circuit breaker runs natively on GenVM.

---

## Live Studio Next Verification for Judges

Judges can verify live deployments on **Studio Next** (`Chain ID: 61997` / `0xf22d`):
* **HaltLayer Contract**: [`0x178D62fB059467545b0b3059C8A1A83C98E0b45E`](https://explorer-studio-dev.genlayer.com/address/0x178D62fB059467545b0b3059C8A1A83C98E0b45E)
* **DemoVault Contract**: [`0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0`](https://explorer-studio-dev.genlayer.com/address/0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0)
* **Live Console**: [https://haltlayer.vercel.app](https://haltlayer.vercel.app)
* **Historical StudioNet Fallback**: [`0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23`](https://genlayer-explorer.vercel.app)

## Quick Verification Commands for Judges

```bash
# 1. Run all 24 direct tests
pytest tests/direct/ -v

# 2. Run GenVM linter
genvm-lint contracts/demo_vault.py
genvm-lint contracts/halt_layer.py

# 3. Run interactive terminal demo
python scripts/demo_flow.py
```
