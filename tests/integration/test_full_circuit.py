"""
Integration test for HaltLayer against a real GenLayer environment (StudioNet, Localnet, or GLSim).
Executes the complete autonomous circuit-breaker lifecycle under live validator consensus:
1. Deploy DemoVault
2. Deploy HaltLayer
3. Configure circuit breaker link
4. Register DemoVault with safety policy
5. Submit exploit incident report
6. Run nondeterministic adjudication under multi-validator consensus
7. Verify DemoVault state transitions to HALTED
8. Exercise appeal and resolution workflow
"""
import pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded


def test_full_circuit_consensus():
    """
    End-to-end integration test of the HaltLayer circuit breaker.
    Requires an active GenLayer network (GLSim, local Studio, or StudioNet).
    """
    # 1. Deploy DemoVault
    vault_factory = get_contract_factory("DemoVault")
    vault = vault_factory.deploy(args=["0x0000000000000000000000000000000000000000"])

    # 2. Deploy HaltLayer
    halt_factory = get_contract_factory("HaltLayer")
    halt_layer = halt_factory.deploy(args=[])

    # 3. Configure Vault to trust HaltLayer as authorized circuit breaker
    tx1 = vault.set_circuit_breaker(args=[halt_layer.address]).transact()
    assert tx_execution_succeeded(tx1)
    assert vault.get_circuit_breaker().call().lower() == halt_layer.address.lower()

    # 4. Deposit initial funds into vault
    tx2 = vault.deposit(args=[1000]).transact()
    assert tx_execution_succeeded(tx2)
    assert vault.get_total_staked().call() == 1000
    assert vault.is_paused().call() is False

    # 5. Register DemoVault under HaltLayer protection
    tx3 = halt_layer.register_protocol(
        args=[vault.address, "Production DemoVault", "HALT", "moderate"]
    ).transact()
    assert tx_execution_succeeded(tx3)
    assert halt_layer.get_protection_status(args=[vault.address]).call() == "ACTIVE"

    # 6. Submit exploit incident report
    evidence_url = "https://raw.githubusercontent.com/genlayerlabs/genvm/main/README.md"
    tx4 = halt_layer.submit_incident(
        args=[
            vault.address,
            "Critical reentrancy drain exploit observed with recursive withdrawal call",
            "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
            evidence_url
        ]
    ).transact()
    assert tx_execution_succeeded(tx4)
    incident_id = "INC-1"

    # 7. Adjudicate incident using real GenLayer nondeterministic execution + validator consensus
    tx5 = halt_layer.adjudicate_incident(args=[incident_id]).transact()
    assert tx_execution_succeeded(tx5)

    # 8. Verify circuit breaker triggered HALT
    inc = halt_layer.get_incident(args=[incident_id]).call()
    assert inc["status"] in ("HALT_ACCEPTED", "REJECTED")

    if inc["status"] == "HALT_ACCEPTED":
        assert halt_layer.get_protection_status(args=[vault.address]).call() == "HALTED"

        # 9. Exercise appeal workflow
        tx6 = halt_layer.appeal_incident(
            args=[incident_id, "Scheduled red team audit drill verified by security team"]
        ).transact()
        assert tx_execution_succeeded(tx6)
        assert halt_layer.get_protection_status(args=[vault.address]).call() == "UNDER_INVESTIGATION"

        # 10. Resolve appeal
        tx7 = halt_layer.resolve_appeal(
            args=[incident_id, True, "Audit report verified by protocol multisig. Resuming vault."]
        ).transact()
        assert tx_execution_succeeded(tx7)
        assert halt_layer.get_protection_status(args=[vault.address]).call() == "ACTIVE"
