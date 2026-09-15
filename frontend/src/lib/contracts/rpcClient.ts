import { decodeCalldata, encodeGenCallPayload, hexToBytes } from "./codec";

export interface RpcConfig {
  endpoint: string;
  networkName: string;
}

export class GenLayerRpcClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public setEndpoint(endpoint: string) {
    this.endpoint = endpoint;
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public async callRaw(method: string, params: any[] = []): Promise<any> {
    // We route through local Next.js /api/rpc to avoid CORS problems in browser
    const isBrowser = typeof window !== "undefined";
    const targetUrl = isBrowser ? "/api/rpc" : this.endpoint;

    const body = isBrowser
      ? JSON.stringify({
          endpoint: this.endpoint,
          method,
          params,
        })
      : JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params,
        });

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`RPC request failed with HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || `RPC Error code ${data.error.code}`);
    }

    return data.result;
  }

  /**
   * Executes a read-only call (gen_call) on a GenLayer intelligent contract.
   */
  public async readContract(
    targetAddress: string,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    const sender = "0x0000000000000000000000000000000000000001";
    const serializedData = encodeGenCallPayload(functionName, args);

    const requestParams = {
      type: "read",
      to: targetAddress,
      from: sender,
      data: serializedData,
      transaction_hash_variant: "latest_nonfinal",
    };

    const rawHex = await this.callRaw("gen_call", [requestParams]);
    if (!rawHex) {
      return null;
    }

    const cleanHex = rawHex.startsWith("0x") ? rawHex.slice(2) : rawHex;
    const bytes = hexToBytes(cleanHex);
    return decodeCalldata(bytes);
  }

  /**
   * Checks network connectivity and returns round-trip latency.
   */
  public async ping(): Promise<{ connected: boolean; latencyMs: number; error: string | null }> {
    const start = Date.now();
    try {
      // Try net_version or eth_blockNumber or simple ping
      await this.callRaw("net_version", []);
      return {
        connected: true,
        latencyMs: Date.now() - start,
        error: null,
      };
    } catch (err: any) {
      return {
        connected: false,
        latencyMs: -1,
        error: err?.message || "Failed to reach GenLayer RPC",
      };
    }
  }

  /**
   * Sends a transaction to the network via /api/tx relay or direct RPC.
   */
  public async sendContractTransaction(
    targetAddress: string,
    functionName: string,
    args: any[] = []
  ): Promise<{ txHash: string }> {
    const response = await fetch("/api/tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetAddress,
        functionName,
        args,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Transaction submission failed");
    }

    return { txHash: data.txHash };
  }

  /**
   * Polls for transaction receipt until accepted or finalized.
   */
  public async waitForReceipt(txHash: string, timeoutMs = 45000, intervalMs = 2500): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      try {
        const receipt = await this.callRaw("eth_getTransactionReceipt", [txHash]);
        if (receipt) {
          return receipt;
        }
      } catch {
        // Continue polling
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Transaction confirmation timed out after ${timeoutMs / 1000}s`);
  }
}
