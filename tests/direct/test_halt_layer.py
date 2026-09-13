"""
Direct mode unit tests for HaltLayer.
Tests protocol registration, incident submission, autonomous adjudication
via nondeterministic execution, equivalence principle validation, and appeals.
"""
import json
import pytest

HALT_CONTRACT = "contracts/halt_layer.py"
EXPLOIT_URL = "https://security.example.com/exploits/vault-drain-alert.json"


def _addr(account_bytes: bytes) -> str:
    return "0x" + account_bytes.hex()


def test_haltlayer_initialization(direct_vm, direct_deploy, direct_owner):
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    assert halt_layer.get_admin().lower() == _addr(direct_owner).lower()
    assert halt_layer.get_protocol_count() == 0
    assert halt_layer.get_incident_count() == 0


def test_protocol_registration(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "1" * 40
    # Alice registers her protocol
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(
        vault_addr,
        "DemoVault",
        "HALT",
        "strong"
    )

    assert halt_layer.get_protocol_count() == 1
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"

    p = halt_layer.get_protocol(vault_addr)
    assert p["name"] == "DemoVault"
    assert p["owner"].lower() == _addr(direct_alice).lower()
    assert p["authorized_halt_capability"] == "HALT"
    assert p["min_evidence_quality"] == "strong"
    assert p["is_active"] is True

    # Bob cannot overwrite Alice's registration
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Unauthorized: only protocol owner can update registration"):
        halt_layer.register_protocol(
            vault_addr,
            "HackedVault",
            "HALT",
            "weak"
        )


def test_registration_validation(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "2" * 40
    direct_vm.sender = direct_alice

    # Invalid capability
    with direct_vm.expect_revert("Invalid halt capability: must be HALT, SAFE_MODE, or ALL"):
        halt_layer.register_protocol(vault_addr, "Test", "INVALID_CAP", "strong")

    # Invalid evidence quality
    with direct_vm.expect_revert("Invalid evidence quality: must be strong, moderate, or weak"):
        halt_layer.register_protocol(vault_addr, "Test", "HALT", "super_strong")


def test_incident_submission(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "3" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "moderate")

    # Unregistered target fails
    direct_vm.sender = direct_bob
    fake_target = "0x" + "4" * 40
    with direct_vm.expect_revert("Target protocol is not registered"):
        halt_layer.submit_incident(fake_target, "Exploit alert", "0xabc", EXPLOIT_URL)

    # Empty description fails
    with direct_vm.expect_revert("Incident description cannot be empty"):
        halt_layer.submit_incident(vault_addr, "", "0xabc", EXPLOIT_URL)

    # Valid submission by Bob (anyone can report)
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Abnormal recursive withdrawal exploit observed draining pool",
        "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
        EXPLOIT_URL
    )

    assert incident_id == "INC-1"
    assert halt_layer.get_incident_count() == 1

    inc = halt_layer.get_incident(incident_id)
    assert inc["incident_id"] == "INC-1"
    assert inc["status"] == "SUBMITTED"
    assert inc["reporter"].lower() == _addr(direct_bob).lower()
    assert inc["threat_severity"] == "none"
    assert inc["recommended_action"] == "NO_ACTION"


def test_adjudication_accepted_halt(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """Test full adjudication producing HALT consensus and transitioning state."""
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "5" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    # Submit incident
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Active reentrancy exploit draining vault reserves rapidly",
        "0x11223344556677889900aabbccddeeff11223344",
        EXPLOIT_URL
    )

    # Setup web mock for exploit alert URL
    direct_vm.mock_web(
        r".*security\.example\.com/exploits/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"threat": "reentrancy_drain", "loss": "2.5M USD"})
        }
    )

    # Setup LLM mock for critical threat assessment
    llm_assessment = {
        "danger": True,
        "severity": "critical",
        "recommended_action": "HALT",
        "evidence_quality": "strong",
        "target_match": True,
        "reason": "Active reentrancy attack draining vault funds. Immediate HALT required."
    }
    direct_vm.mock_llm(r".*HaltLayer Autonomous Emergency Circuit-Breaker.*", json.dumps(llm_assessment))

    # Trigger adjudication
    halt_layer.adjudicate_incident(incident_id)

    # Verify incident state transitioned to HALT_ACCEPTED
    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "HALT_ACCEPTED"
    assert inc["threat_severity"] == "critical"
    assert inc["recommended_action"] == "HALT"
    assert inc["evidence_quality"] == "strong"
    assert "reentrancy" in inc["adjudication_reason"].lower()

    # Verify protocol protection status is now HALTED
    assert halt_layer.get_protection_status(vault_addr) == "HALTED"


def test_adjudication_rejected_low_risk(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """Test adjudication where LLM and consensus determine activity is benign/low risk."""
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "6" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    # Submit incident
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "High volume transaction noticed in mempool",
        "0xaabbccdd",
        ""
    )

    # Mock low risk response
    llm_assessment = {
        "danger": False,
        "severity": "low",
        "recommended_action": "NO_ACTION",
        "evidence_quality": "moderate",
        "target_match": True,
        "reason": "Routine high-volume trade with standard slippage. No vulnerability detected."
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["threat_severity"] == "low"
    assert inc["recommended_action"] == "NO_ACTION"

    # Protocol remains ACTIVE
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"


def test_appeal_lifecycle(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """Test the full appeal state machine from HALT_ACCEPTED to APPEALED and RESOLVED_RESUME."""
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "7" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    # Submit and adjudicate to HALT
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Exploit anomaly attack reported",
        "0x112233",
        ""
    )

    llm_assessment = {
        "danger": True,
        "severity": "high",
        "recommended_action": "HALT",
        "evidence_quality": "strong",
        "target_match": True,
        "reason": "Suspicious vulnerability pattern triggered"
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))
    halt_layer.adjudicate_incident(incident_id)

    assert halt_layer.get_protection_status(vault_addr) == "HALTED"
    assert halt_layer.get_incident(incident_id)["status"] == "HALT_ACCEPTED"

    # Cannot appeal with empty reason
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Appeal reason cannot be empty"):
        halt_layer.appeal_incident(incident_id, "")

    # Alice files valid appeal
    halt_layer.appeal_incident(incident_id, "Whitehat drill conducted by certified auditor.")
    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "APPEALED"
    assert inc["appeal_reason"] == "Whitehat drill conducted by certified auditor."
    assert halt_layer.get_protection_status(vault_addr) == "UNDER_INVESTIGATION"

    # Unauthorized party (bob) cannot resolve appeal
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Unauthorized: only protocol owner or admin can resolve appeal"):
        halt_layer.resolve_appeal(incident_id, True, "Fraudulent resolution attempt")

    # Alice (protocol owner) overturns the halt
    direct_vm.sender = direct_alice
    halt_layer.resolve_appeal(incident_id, True, "Auditor verification confirmed drill complete. Safe to resume.")

    final_inc = halt_layer.get_incident(incident_id)
    assert final_inc["status"] == "RESOLVED_RESUME"
    assert "Auditor verification" in final_inc["appeal_resolution"]
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"


def test_appeal_upheld_final_halt(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """Test appeal resolution that upholds the halt (overturn=False) -> FINAL_HALT."""
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "8" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(vault_addr, "Drain attack verified", "0x99", "")

    llm_assessment = {
        "danger": True,
        "severity": "critical",
        "recommended_action": "HALT",
        "evidence_quality": "strong",
        "target_match": True,
        "reason": "Confirmed drain exploit"
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))
    halt_layer.adjudicate_incident(incident_id)

    # Alice appeals
    direct_vm.sender = direct_alice
    halt_layer.appeal_incident(incident_id, "Claiming false positive")

    # Admin investigates and rejects the appeal (overturn=False)
    direct_vm.sender = direct_owner
    halt_layer.resolve_appeal(incident_id, False, "On-chain loss confirmed. Appeal rejected.")

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "FINAL_HALT"
    assert halt_layer.get_protection_status(vault_addr) == "HALTED"
