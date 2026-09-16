import { NextRequest, NextResponse } from "next/server";

/**
 * Production Studio Next Read Proxy (Chain 61997 / 0xf22d)
 *
 * Security Invariants Enforced (PRIORITY 7):
 * 1. Fixed server-side RPC destination (SSRF immune): https://studio-next.genlayer.com/api
 * 2. Strict method allowlist: read-only queries only, rejecting all write/sign/arbitrary forwarding
 * 3. Contract target allowlisting on gen_call: only Studio Next HaltLayer & DemoVault
 * 4. Rejection of credential or secret injection
 * 5. Zero secret exposure in responses
 */

const STUDIO_NEXT_RPC = "https://studio-next.genlayer.com/api";

const ALLOWED_TARGETS = new Set([
  "0x178D62fB059467545b0b3059C8A1A83C98E0b45E".toLowerCase(),
  "0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0".toLowerCase(),
]);

const ALLOWED_RPC_METHODS = new Set([
  "gen_call",
  "net_version",
  "eth_chainId",
  "eth_blockNumber",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
]);

export async function GET() {
  try {
    const upstreamRes = await fetch(STUDIO_NEXT_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "HaltLayer-Production-Proxy",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
    });

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      return NextResponse.json(data);
    }
  } catch {
    // Upstream fallback
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    id: 1,
    result: "0xf22d",
    chainId: "0xf22d",
    network: "Studio Next",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params } = body;

    // 1. Strict RPC method allowlist (rejects arbitrary transaction forwarding)
    if (!method || !ALLOWED_RPC_METHODS.has(method)) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: 0,
          error: {
            code: -32601,
            message: `RPC method not allowed via public proxy: ${method}`,
          },
        },
        { status: 403 }
      );
    }

    // 2. Reject credentials or secret exposure attempts
    if (body.privateKey || body.signer || body.secret || body.key || body.seed) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: 0,
          error: {
            code: -32600,
            message: "Passing credentials or secrets to public RPC proxy is strictly forbidden",
          },
        },
        { status: 400 }
      );
    }

    // 3. Target allowlist for gen_call (readContract)
    if (method === "gen_call") {
      const callParams = params?.[0];
      const targetTo = (callParams?.to || "").toLowerCase().trim();

      if (!targetTo || !ALLOWED_TARGETS.has(targetTo)) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: 0,
            error: {
              code: -32602,
              message: `Unauthorized contract target for gen_call: ${targetTo}. Production Studio Next targets are: 0x178D62fB059467545b0b3059C8A1A83C98E0b45E and 0xE096057d2bB63B13Cb4200aE45A4114A283cE3E0`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. Fixed server-side upstream destination (SSRF protection: client cannot override)
    const targetUrl = STUDIO_NEXT_RPC;

    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: params || [],
    };

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "HaltLayer-Production-Proxy",
      },
      body: JSON.stringify(payload),
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: payload.id,
          error: {
            code: -32000,
            message: `GenLayer upstream node returned status ${upstreamRes.status}`,
          },
        },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: 0,
        error: {
          code: -32603,
          message: err?.message || "Internal RPC proxy error",
        },
      },
      { status: 500 }
    );
  }
}
