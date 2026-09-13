import { GenLayerRpcClient } from "./rpcClient";
import { DemoVaultState } from "./types";

export class DemoVaultClient {
  private rpc: GenLayerRpcClient;
  public address: string;

  constructor(rpc: GenLayerRpcClient, address: string) {
    this.rpc = rpc;
    this.address = address;
  }

  public setAddress(address: string) {
    this.address = address;
  }

  public async isPaused(): Promise<boolean> {
    const res = await this.rpc.readContract(this.address, "is_paused", []);
    return Boolean(res);
  }

  public async isSafeMode(): Promise<boolean> {
    const res = await this.rpc.readContract(this.address, "is_safe_mode", []);
    return Boolean(res);
  }

  public async getTotalStaked(): Promise<number> {
    const res = await this.rpc.readContract(this.address, "get_total_staked", []);
    return Number(res || 0);
  }

  public async getOwner(): Promise<string> {
    return await this.rpc.readContract(this.address, "get_owner", []);
  }

  public async getCircuitBreaker(): Promise<string> {
    return await this.rpc.readContract(this.address, "get_circuit_breaker", []);
  }

  public async getBalance(account: string): Promise<number> {
    const res = await this.rpc.readContract(this.address, "get_balance", [account]);
    return Number(res || 0);
  }

  public async getState(userAccount = "0x0000000000000000000000000000000000000001"): Promise<DemoVaultState> {
    const [paused, safeMode, totalStaked, owner, circuitBreaker, balance] = await Promise.all([
      this.isPaused(),
      this.isSafeMode(),
      this.getTotalStaked(),
      this.getOwner(),
      this.getCircuitBreaker(),
      this.getBalance(userAccount).catch(() => 0),
    ]);

    return {
      address: this.address,
      owner,
      circuit_breaker: circuitBreaker,
      total_staked: totalStaked,
      is_paused: paused,
      is_safe_mode: safeMode,
      user_balance: balance,
    };
  }

  // --- Transactions ---

  public async deposit(amount: number): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "deposit", [amount]);
  }

  public async withdraw(amount: number): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "withdraw", [amount]);
  }

  public async pause(): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "pause", []);
  }

  public async resume(): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "resume", []);
  }

  public async activateSafeMode(): Promise<{ txHash: string }> {
    return await this.rpc.sendContractTransaction(this.address, "activate_safe_mode", []);
  }
}
