"""
HaltLayer Live Demo Scenario Script
Simulates and demonstrates the complete autonomous emergency circuit-breaker flow:

ACTIVE
  ↓
INCIDENT SUBMITTED
  ↓
INVESTIGATING EVIDENCE (Web retrieval + LLM analysis)
  ↓
GENLAYER CONSENSUS (Equivalence Principle validation)
  ↓
THREAT CONFIRMED
  ↓
HALTLAYER ACTIVATED
  ↓
DEMOVAULT HALTED
  ↓
APPEAL SUBMITTED & RESOLVED
"""
import sys
import json
from pathlib import Path

# Setup direct mode loader so this demo runs standalone in any environment
sys.path.insert(0, str(Path(__file__).parent.parent))
from gltest.direct.vm import VMContext
from gltest.direct.loader import deploy_contract

# ANSI Colors for terminal presentation
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_step(title, status, detail=""):
    print(f"\n{BOLD}{CYAN}------------------------------------------------------------{RESET}")
    print(f"{BOLD}STAGE: {title}{RESET}")
    print(f"Status: {status}")
    if detail:
        print(f"Detail: {detail}")
    print(f"{BOLD}{CYAN}------------------------------------------------------------{RESET}")


def main():
    print(f"\n{BOLD}{BLUE}============================================================{RESET}")
    print(f"{BOLD}{BLUE}      HALTLAYER : AUTONOMOUS EMERGENCY CIRCUIT-BREAKER      {RESET}")
    print(f"{BOLD}{BLUE}   Intelligent Contract Protection for Autonomous Protocols  {RESET}")
    print(f"{BOLD}{BLUE}============================================================{RESET}")

    owner_addr = "0x1111111111111111111111111111111111111111"
    reporter_addr = "0x2222222222222222222222222222222222222222"
    attacker_addr = "0x3333333333333333333333333333333333333333"

    print_step("DEPLOYMENT", f"{GREEN}ONLINE{RESET}", "Deploying DemoVault and HaltLayer intelligent contracts...")

    # 1. Deploy DemoVault
    vm_vault = VMContext()
    vm_vault.sender = bytes.fromhex(owner_addr[2:])

    # 2. Deploy HaltLayer
    vm_halt = VMContext()
    vm_halt.sender = bytes.fromhex(owner_addr[2:])

    with vm_vault.activate():
        vault = deploy_contract(Path("contracts/demo_vault.py"), vm_vault, "0x" + "0" * 40)
        vault_addr = "0x" + vm_vault._contract_address.hex()
        vault.deposit(5000000)
        initial_vault_paused = vault.is_paused()

    with vm_halt.activate():
        halt_layer = deploy_contract(Path("contracts/halt_layer.py"), vm_halt)
        halt_addr = "0x" + vm_halt._contract_address.hex()

        # Connect HaltLayer to DemoVault
        halt_layer.register_protocol(vault_addr, "LendingReserveVault", "HALT", "strong")
        prot_status = halt_layer.get_protection_status(vault_addr)

        print(f"  * Protected Protocol : LendingReserveVault ({vault_addr})")
        print(f"  * HaltLayer Breaker  : {halt_addr}")
        print(f"  * Total Staked Value : $5,000,000 USD")
        print(f"  * Initial Protection : {GREEN}{prot_status}{RESET}")
        print(f"  * Vault Paused State : {GREEN}{initial_vault_paused}{RESET}")

        # 2. Exploit detected and reported
        print_step("INCIDENT SUBMITTED", f"{YELLOW}PENDING REVIEW{RESET}", "Autonomous monitoring agent detects abnormal withdrawal spike.")
        vm_halt.sender = bytes.fromhex(reporter_addr[2:])
        incident_id = halt_layer.submit_incident(
            vault_addr,
            "Critical reentrancy drain exploit observed with recursive withdrawal call",
            "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
            "https://security.example.com/exploits/vault-drain-alert.json"
        )
        print(f"  * Incident ID       : {incident_id}")
        print(f"  * Reported By       : {reporter_addr}")
        print(f"  * Anomaly Detail    : Critical recursive reentrancy drain pattern")

        # 3. Setup mock web & LLM for GenLayer intelligent consensus
        vm_halt.mock_web(
            r".*security\.example\.com/exploits/.*",
            {
                "status": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"threat": "reentrancy_drain", "drain_rate_usd_sec": 50000})
            }
        )
        llm_assessment = {
            "danger": True,
            "severity": "critical",
            "recommended_action": "HALT",
            "evidence_quality": "strong",
            "target_match": True,
            "reason": "Active reentrancy attack draining vault reserves. Immediate emergency HALT required."
        }
        vm_halt.mock_llm(r".*HaltLayer Autonomous Emergency Circuit-Breaker.*", json.dumps(llm_assessment))

        # 4. Adjudication & Consensus
        print_step("INVESTIGATING EVIDENCE & REACHING CONSENSUS", f"{CYAN}ADJUDICATING{RESET}", "GenVM nondeterministic retrieval + Equivalence Principle validation...")
        halt_layer.adjudicate_incident(incident_id)
        inc = halt_layer.get_incident(incident_id)
        status = halt_layer.get_protection_status(vault_addr)

        # 5. Threat confirmed & Halt triggered
        print_step("THREAT CONFIRMED -> HALTLAYER ACTIVATED", f"{RED}HALTED{RESET}", inc["adjudication_reason"])
        print(f"  * Incident Status   : {RED}{inc['status']}{RESET}")
        print(f"  * Threat Severity   : {RED}{inc['threat_severity'].upper()}{RESET}")
        print(f"  * Action Executed   : {RED}{inc['recommended_action']}{RESET}")
        print(f"  * Protection Status : {RED}{status}{RESET}")

        # 6. Appeal procedure
        print_step("APPEAL FILED", f"{YELLOW}UNDER INVESTIGATION{RESET}", "Protocol owner files appeal with verified security patch.")
        vm_halt.sender = bytes.fromhex(owner_addr[2:])
        halt_layer.appeal_incident(incident_id, "Smart contract patched and vulnerability neutralized by security council.")
        under_inv = halt_layer.get_protection_status(vault_addr)
        print(f"  * Protection Status : {YELLOW}{under_inv}{RESET}")

        # 7. Appeal resolved and protocol resumed
        print_step("APPEAL RESOLVED -> SAFE RESUME", f"{GREEN}ACTIVE{RESET}", "Council multisig verifies mitigation and resumes protocol.")
        halt_layer.resolve_appeal(incident_id, True, "Vulnerability audit passed. Resuming vault.")
        final_inc = halt_layer.get_incident(incident_id)
        final_prot = halt_layer.get_protection_status(vault_addr)

        print(f"  * Final Incident Status   : {GREEN}{final_inc['status']}{RESET}")
        print(f"  * Final Protection Status : {GREEN}{final_prot}{RESET}")

    # Verify Vault defense in DemoVault VM
    with vm_vault.activate():
        vault.set_circuit_breaker(halt_addr)
        vm_vault.sender = bytes.fromhex(halt_addr[2:])
        vault.pause()

        print_step("SAFETY ENFORCEMENT ON TARGET PROTOCOL", f"{GREEN}PROTECTION VERIFIED{RESET}", "Verifying attacker is blocked from unauthorized withdrawal...")
        print(f"  * Vault Circuit-Breaker : {vault.get_circuit_breaker()}")
        print(f"  * DemoVault Paused State: {RED}{vault.is_paused()}{RESET}")

        # Try exploit withdrawal as attacker
        vm_vault.sender = bytes.fromhex(attacker_addr[2:])
        try:
            vault.withdraw(1000000)
            print("  * ERROR: Withdrawal unexpectedly succeeded!")
        except Exception as e:
            print(f"  * Attacker Withdrawal Blocked: {GREEN}BLOCKED ({e}){RESET}")

        # Resume vault after resolution
        vm_vault.sender = bytes.fromhex(halt_addr[2:])
        vault.resume()
        print(f"  * Post-Appeal Vault Paused State: {GREEN}{vault.is_paused()} (Normal operations restored){RESET}")

    print(f"\n{BOLD}{GREEN}[OK] HaltLayer autonomous emergency circuit-breaker flow completed successfully!{RESET}\n")


if __name__ == "__main__":
    main()

