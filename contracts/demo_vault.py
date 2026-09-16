# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import genlayer as gl
from genlayer import *
from genlayer.storage import TreeMap
from genlayer.types import Address, u256


def _as_address(addr) -> Address:
    if isinstance(addr, Address):
        return addr
    return Address(str(addr))


class DemoVault(gl.contract.Contract):
    """
    DemoVault: Protected target protocol for HaltLayer.
    Exposes deposit, withdraw, pause, resume, and emergency-safe controls.
    """
    owner: Address
    circuit_breaker: Address
    balances: TreeMap[Address, u256]
    total_staked: u256
    paused: bool
    safe_mode: bool

    def __init__(self, circuit_breaker_addr: str):
        self.owner = gl.message.sender_address
        self.circuit_breaker = _as_address(circuit_breaker_addr)
        self.total_staked = u256(0)
        self.paused = False
        self.safe_mode = False

    # ── Write Methods ──────────────────────────────────────────────────────────

    @gl.public.write
    def deposit(self, amount: u256) -> None:
        """Deposit funds into the vault. Blocked if vault is paused or in safe mode."""
        if self.is_paused():
            raise gl.vm.UserError("Vault is paused: deposits disabled")
        if self.is_safe_mode():
            raise gl.vm.UserError("Vault in safe mode: deposits disabled")
        if int(amount) <= 0:
            raise gl.vm.UserError("Deposit amount must be positive")

        sender = gl.message.sender_address
        current = self.balances.get(sender, u256(0))
        self.balances[sender] = u256(int(current) + int(amount))
        self.total_staked = u256(int(self.total_staked) + int(amount))

    @gl.public.write
    def withdraw(self, amount: u256) -> None:
        """Withdraw funds from the vault. Blocked if vault is paused or in safe mode."""
        if self.is_paused():
            raise gl.vm.UserError("Vault is paused: withdrawals disabled")
        if self.is_safe_mode():
            raise gl.vm.UserError("Vault in safe mode: withdrawals restricted")
        if int(amount) <= 0:
            raise gl.vm.UserError("Withdrawal amount must be positive")

        sender = gl.message.sender_address
        current = self.balances.get(sender, u256(0))
        if int(current) < int(amount):
            raise gl.vm.UserError("Insufficient balance")

        self.balances[sender] = u256(int(current) - int(amount))
        self.total_staked = u256(int(self.total_staked) - int(amount))

    @gl.public.write
    def pause(self) -> None:
        """Emergency pause: can only be called by vault owner or authorized circuit breaker."""
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.circuit_breaker:
            raise gl.vm.UserError("Unauthorized: only owner or circuit breaker can pause")
        if self.paused:
            raise gl.vm.UserError("Vault is already paused")
        self.paused = True

    @gl.public.write
    def resume(self) -> None:
        """Resume vault operation: can only be called by vault owner or authorized circuit breaker."""
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.circuit_breaker:
            raise gl.vm.UserError("Unauthorized: only owner or circuit breaker can resume")
        if not self.paused and not self.safe_mode:
            raise gl.vm.UserError("Vault is not paused")
        self.paused = False
        self.safe_mode = False

    @gl.public.write
    def activate_safe_mode(self) -> None:
        """Activate safe mode: limits operation to low-risk defensive posture."""
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.circuit_breaker:
            raise gl.vm.UserError("Unauthorized: only owner or circuit breaker can activate safe mode")
        self.safe_mode = True

    @gl.public.write
    def set_circuit_breaker(self, new_circuit_breaker: str) -> None:
        """Update circuit breaker address. Only callable by vault owner."""
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Unauthorized: only owner can set circuit breaker")
        self.circuit_breaker = _as_address(new_circuit_breaker)

    # ── View Methods ───────────────────────────────────────────────────────────

    @gl.public.view
    def is_paused(self) -> bool:
        if self.paused:
            return True
        if self.circuit_breaker.as_hex != "0x0000000000000000000000000000000000000000":
            try:
                cb = gl.get_contract_at(self.circuit_breaker)
                if cb.view().get_protection_status(gl.message.contract_address.as_hex) == "HALTED":
                    return True
            except Exception:
                pass
        return False

    @gl.public.view
    def is_safe_mode(self) -> bool:
        if self.safe_mode:
            return True
        if self.circuit_breaker.as_hex != "0x0000000000000000000000000000000000000000":
            try:
                cb = gl.get_contract_at(self.circuit_breaker)
                if cb.view().get_protection_status(gl.message.contract_address.as_hex) == "SAFE_MODE":
                    return True
            except Exception:
                pass
        return False

    @gl.public.view
    def get_balance(self, account: str) -> int:
        return int(self.balances.get(_as_address(account), u256(0)))

    @gl.public.view
    def get_total_staked(self) -> int:
        return int(self.total_staked)

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def get_circuit_breaker(self) -> str:
        return self.circuit_breaker.as_hex
