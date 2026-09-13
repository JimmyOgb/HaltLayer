"""
Direct mode unit tests for DemoVault.
Tests deposit, withdrawal, access controls, pause, resume, and emergency safe mode.
"""
import pytest

VAULT_CONTRACT = "contracts/demo_vault.py"


def _addr(account_bytes: bytes) -> str:
    return "0x" + account_bytes.hex()


def test_initial_state(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    alice_addr = _addr(direct_alice)
    vault = direct_deploy(VAULT_CONTRACT, alice_addr)

    assert vault.get_owner().lower() == _addr(direct_owner).lower()
    assert vault.get_circuit_breaker().lower() == alice_addr.lower()
    assert vault.is_paused() is False
    assert vault.is_safe_mode() is False
    assert vault.get_total_staked() == 0


def test_deposit_and_balance(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    vault = direct_deploy(VAULT_CONTRACT, _addr(direct_owner))

    direct_vm.sender = direct_alice
    vault.deposit(1000)

    alice_addr = _addr(direct_alice)
    assert vault.get_balance(alice_addr) == 1000
    assert vault.get_total_staked() == 1000


def test_withdrawal(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    vault = direct_deploy(VAULT_CONTRACT, _addr(direct_owner))

    direct_vm.sender = direct_alice
    vault.deposit(1000)
    vault.withdraw(400)

    alice_addr = _addr(direct_alice)
    assert vault.get_balance(alice_addr) == 600
    assert vault.get_total_staked() == 600


def test_withdraw_insufficient_balance(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    vault = direct_deploy(VAULT_CONTRACT, _addr(direct_owner))

    direct_vm.sender = direct_alice
    vault.deposit(100)

    with direct_vm.expect_revert("Insufficient balance"):
        vault.withdraw(200)


def test_pause_and_unauthorized(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    alice_addr = _addr(direct_alice)
    vault = direct_deploy(VAULT_CONTRACT, alice_addr)  # alice is circuit breaker

    # Unauthorized caller (bob) cannot pause
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Unauthorized: only owner or circuit breaker can pause"):
        vault.pause()

    # Authorized circuit breaker (alice) can pause
    direct_vm.sender = direct_alice
    vault.pause()
    assert vault.is_paused() is True

    # Already paused reverts
    with direct_vm.expect_revert("Vault is already paused"):
        vault.pause()


def test_deposit_and_withdrawal_blocked_when_paused(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    vault = direct_deploy(VAULT_CONTRACT, _addr(direct_owner))

    # Alice deposits funds before pause
    direct_vm.sender = direct_alice
    vault.deposit(500)

    # Owner pauses vault
    direct_vm.sender = direct_owner
    vault.pause()

    # Deposit while paused must revert
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Vault is paused: deposits disabled"):
        vault.deposit(100)

    # Withdrawal while paused must revert
    with direct_vm.expect_revert("Vault is paused: withdrawals disabled"):
        vault.withdraw(100)


def test_resume_flow(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    alice_addr = _addr(direct_alice)
    vault = direct_deploy(VAULT_CONTRACT, alice_addr)

    # Pause
    direct_vm.sender = direct_owner
    vault.pause()
    assert vault.is_paused() is True

    # Bob unauthorized resume
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Unauthorized: only owner or circuit breaker can resume"):
        vault.resume()

    # Alice (circuit breaker) resumes
    direct_vm.sender = direct_alice
    vault.resume()
    assert vault.is_paused() is False

    # Normal deposits work again
    direct_vm.sender = direct_bob
    vault.deposit(300)
    assert vault.get_balance(_addr(direct_bob)) == 300


def test_safe_mode_activation(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    alice_addr = _addr(direct_alice)
    vault = direct_deploy(VAULT_CONTRACT, alice_addr)

    # Bob unauthorized
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Unauthorized: only owner or circuit breaker can activate safe mode"):
        vault.activate_safe_mode()

    # Circuit breaker activates safe mode
    direct_vm.sender = direct_alice
    vault.activate_safe_mode()
    assert vault.is_safe_mode() is True

    # Deposits blocked in safe mode
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Vault in safe mode: deposits disabled"):
        vault.deposit(50)


def test_set_circuit_breaker(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob):
    direct_vm.sender = direct_owner
    alice_addr = _addr(direct_alice)
    bob_addr = _addr(direct_bob)
    vault = direct_deploy(VAULT_CONTRACT, alice_addr)

    # Alice cannot change circuit breaker
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Unauthorized: only owner can set circuit breaker"):
        vault.set_circuit_breaker(bob_addr)

    # Owner changes circuit breaker to bob
    direct_vm.sender = direct_owner
    vault.set_circuit_breaker(bob_addr)
    assert vault.get_circuit_breaker().lower() == bob_addr.lower()
