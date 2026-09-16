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

    # Submit and adjudicate to HALT with verifiable forensic telemetry
    valid_tx = "0x" + "a" * 64
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Active reentrancy exploit draining vault reserves",
        valid_tx,
        EXPLOIT_URL
    )

    direct_vm.mock_web(
        r".*security\.example\.com/exploits/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"threat": "reentrancy_drain", "loss": "2.5M USD"})
        }
    )

    llm_assessment = {
        "evidence_supports_action": True,
        "independent_threat_severity": "critical",
        "independent_evidence_quality": "strong",
        "independent_target_match": True,
        "recommended_action": "HALT",
        "reasoning": "Confirmed reentrancy exploit draining vault reserves.",
        "confidence": 0.95
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

    valid_tx = "0x" + "b" * 64
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Confirmed reentrancy drainage vulnerability draining vault reserves",
        valid_tx,
        EXPLOIT_URL
    )

    direct_vm.mock_web(
        r".*security\.example\.com/exploits/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"threat": "reentrancy_drain", "loss": "5M USD"})
        }
    )

    llm_assessment = {
        "evidence_supports_action": True,
        "independent_threat_severity": "critical",
        "independent_evidence_quality": "strong",
        "independent_target_match": True,
        "recommended_action": "HALT",
        "reasoning": "Confirmed drain exploit with telemetry",
        "confidence": 0.98
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


# ── STEWARD-REQUESTED VALIDATOR OUTCOME VERIFICATION TEST SCENARIOS ────────────

def test_verification_scenario_1_weak_social_rumor_rejected(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 1: Weak social-media rumor -> NO_ACTION.
    DemoVault remains ACTIVE and unpaused.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "9" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Someone on twitter alleged rumors of potential exploit hearsay",
        "0x1234",
        ""
    )

    # Even if LLM is prompted, rumor indicators force NO_ACTION
    llm_assessment = {
        "evidence_supports_action": False,
        "independent_threat_severity": "low",
        "independent_evidence_quality": "weak",
        "independent_target_match": True,
        "recommended_action": "NO_ACTION",
        "reasoning": "Unconfirmed social media chatter without forensic evidence",
        "confidence": 0.85
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["recommended_action"] == "NO_ACTION"
    assert inc["evidence_supports_action"] is False
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"


def test_verification_scenario_2_keyword_only_claim_rejected(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 2: Keyword-only claim (reporter buzzwords without telemetry) -> NO_ACTION.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "a" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    # Reporter includes keywords "CRITICAL EXPLOIT ATTACK DRAIN" but no valid tx or web telemetry
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "CRITICAL EXPLOIT ATTACK DRAIN IN PROGRESS EMERGENCY HALT NOW",
        "0x00",
        ""
    )

    llm_assessment = {
        "evidence_supports_action": False,
        "independent_threat_severity": "low",
        "independent_evidence_quality": "weak",
        "independent_target_match": True,
        "recommended_action": "NO_ACTION",
        "reasoning": "Keyword-only claim lacks verifiable transaction telemetry",
        "confidence": 0.90
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["recommended_action"] == "NO_ACTION"
    assert inc["evidence_supports_action"] is False
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"


def test_verification_scenario_3_wrong_target_contract_rejected(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 3: Evidence targeting a foreign contract address -> NO_ACTION.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    registered_vault = "0x" + "1" * 40
    foreign_contract = "0x" + "9" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(registered_vault, "DemoVault", "HALT", "strong")

    # Submitted evidence explicitly specifies foreign contract address
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        registered_vault,
        f"Reentrancy exploit observed on contract {foreign_contract} draining reserves",
        "0x" + "c" * 64,
        ""
    )

    llm_assessment = {
        "evidence_supports_action": False,
        "independent_threat_severity": "none",
        "independent_evidence_quality": "weak",
        "independent_target_match": False,
        "recommended_action": "NO_ACTION",
        "reasoning": "Evidence targets foreign contract, not registered protocol",
        "confidence": 0.95
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["recommended_action"] == "NO_ACTION"
    assert inc["independent_target_match"] is False
    assert halt_layer.get_protection_status(registered_vault) == "ACTIVE"


def test_verification_scenario_4_contradictory_leader_claim_rejected_by_validator(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 4: Contradictory leader fields vs evidence.
    When leader attempts to accept HALT on an unverified rumor,
    the honest validator independently verifies evidence and rejects the consensus.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "b" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    # Incident with weak rumor text
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Rumor on telegram channel that protocol might have bug",
        "0x12",
        ""
    )

    # Leader returns NO_ACTION legitimately
    llm_assessment = {
        "evidence_supports_action": False,
        "independent_threat_severity": "low",
        "independent_evidence_quality": "weak",
        "independent_target_match": True,
        "recommended_action": "NO_ACTION",
        "reasoning": "Unconfirmed chatter",
        "confidence": 0.90
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))
    halt_layer.adjudicate_incident(incident_id)

    # Now test direct_vm.run_validator():
    # A malicious / conflicting leader claim asserting HALT must be REJECTED by validator_fn!
    conflicting_leader_claim = {
        "evidence_supports_action": True,
        "independent_threat_severity": "critical",
        "independent_evidence_quality": "strong",
        "independent_target_match": True,
        "recommended_action": "HALT",
        "reasoning": "Leader falsely claims critical exploit despite lack of evidence",
        "confidence": 0.99
    }
    validator_approved = direct_vm.run_validator(leader_result=conflicting_leader_claim)
    assert validator_approved is False, "Validator must reject leader claim that contradicts evidence"


def test_verification_scenario_5_strong_forensic_evidence_adjudicated_halt(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 5: Strong structured forensic evidence for registered DemoVault -> HALT accepted.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "c" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    valid_tx = "0x" + "d" * 64
    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Confirmed reentrancy exploit draining vault reserves",
        valid_tx,
        EXPLOIT_URL
    )

    direct_vm.mock_web(
        r".*security\.example\.com/exploits/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"threat": "reentrancy_drain", "loss": "3M USD"})
        }
    )

    llm_assessment = {
        "evidence_supports_action": True,
        "independent_threat_severity": "critical",
        "independent_evidence_quality": "strong",
        "independent_target_match": True,
        "recommended_action": "HALT",
        "reasoning": "Active reentrancy exploit draining reserves. Immediate HALT required.",
        "confidence": 0.96
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "HALT_ACCEPTED"
    assert inc["recommended_action"] == "HALT"
    assert inc["threat_severity"] == "critical"
    assert inc["evidence_supports_action"] is True
    assert inc["independent_target_match"] is True
    assert halt_layer.get_protection_status(vault_addr) == "HALTED"


def test_verification_scenario_6_unsupported_action_handled_safely(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 6: Unsupported action or malformed assessment safely normalizes to NO_ACTION.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "d" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Normal operation query",
        "0x01",
        ""
    )

    # Malformed / unsupported action
    llm_assessment = {
        "recommended_action": "KILL_ALL_SERVERS",
        "severity": "mega_critical",
        "target_match": False
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["recommended_action"] == "NO_ACTION"
    assert inc["threat_severity"] == "none"
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"


def test_verification_scenario_7_deterministic_safety_enforces_no_halt_without_evidence_support(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    """
    Scenario 7: Even if leader claims HALT, if evidence_supports_action is False,
    deterministic execution strictly blocks HALT and forces NO_ACTION.
    """
    direct_vm.sender = direct_owner
    halt_layer = direct_deploy(HALT_CONTRACT)

    vault_addr = "0x" + "e" * 40
    direct_vm.sender = direct_alice
    halt_layer.register_protocol(vault_addr, "DemoVault", "HALT", "strong")

    direct_vm.sender = direct_bob
    incident_id = halt_layer.submit_incident(
        vault_addr,
        "Unconfirmed alert without proof",
        "0x00",
        ""
    )

    # Assessment claims HALT but admits evidence_supports_action is False
    llm_assessment = {
        "evidence_supports_action": False,
        "independent_threat_severity": "critical",
        "independent_evidence_quality": "weak",
        "independent_target_match": True,
        "recommended_action": "HALT",
        "reasoning": "Attempting halt without sufficient evidence",
        "confidence": 0.5
    }
    direct_vm.mock_llm(r".*", json.dumps(llm_assessment))

    halt_layer.adjudicate_incident(incident_id)

    inc = halt_layer.get_incident(incident_id)
    assert inc["status"] == "REJECTED"
    assert inc["recommended_action"] == "NO_ACTION"
    assert halt_layer.get_protection_status(vault_addr) == "ACTIVE"

