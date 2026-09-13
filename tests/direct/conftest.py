"""
Shared fixtures and test configuration for HaltLayer direct-mode tests.
"""
import pytest
import json

EXPLOIT_URL = "https://security.example.com/exploits/vault-drain-alert.json"

MOCK_EXPLOIT_EVIDENCE = {
    "protocol": "DemoVault",
    "threat_type": "reentrancy_drain",
    "severity": "critical",
    "stolen_amount_usd": 2500000,
    "compromised_functions": ["withdraw"],
    "malicious_txs": ["0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b"],
    "analysis": "Repeated recursive withdrawal observed draining reserve pool."
}

MOCK_BENIGN_EVIDENCE = {
    "protocol": "DemoVault",
    "threat_type": "normal_arbitrage",
    "severity": "low",
    "analysis": "Routine rebalancing transaction with standard slippage."
}

MOCK_CRITICAL_HALT_LLM_RESPONSE = {
    "danger": True,
    "severity": "critical",
    "recommended_action": "HALT",
    "evidence_quality": "strong",
    "target_match": True,
    "reason": "Active reentrancy attack draining vault funds. Immediate HALT required."
}

MOCK_LOW_RISK_LLM_RESPONSE = {
    "danger": False,
    "severity": "low",
    "recommended_action": "NO_ACTION",
    "evidence_quality": "moderate",
    "target_match": True,
    "reason": "Activity matches normal arbitrage pattern. No abnormal exploit detected."
}

@pytest.fixture
def mock_exploit_web(direct_vm):
    """Register mock web response for exploit alert."""
    direct_vm.mock_web(
        r".*security\.example\.com/exploits/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(MOCK_EXPLOIT_EVIDENCE)
        }
    )

@pytest.fixture
def mock_benign_web(direct_vm):
    """Register mock web response for benign event."""
    direct_vm.mock_web(
        r".*security\.example\.com/benign/.*",
        {
            "status": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(MOCK_BENIGN_EVIDENCE)
        }
    )
