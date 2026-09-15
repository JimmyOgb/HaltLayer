import { NextRequest, NextResponse } from "next/server";

const ALLOWED_RPC_ENDPOINTS = new Set([
  "https://studio.genlayer.com/api",
  "https://testnet-bradbury.genlayer.foundation",
  "http://127.0.0.1:4000/api",
  "http://localhost:4000/api",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, method, params } = body;

    // Strict method allowlist for read-only RPC proxying
    const ALLOWED_RPC_METHODS = new Set([
      "gen_call",
      "net_version",
      "eth_chainId",
      "eth_blockNumber",
      "eth_getTransactionReceipt",
      "eth_getTransactionByHash",
    ]);

    if (!method || !ALLOWED_RPC_METHODS.has(method)) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: 0,
          error: {
            code: -32601,
            message: `RPC method not allowed via public read proxy: ${method}`,
          },
        },
        { status: 403 }
      );
    }

    // Enforce SSRF protection: only allowlisted RPC destinations permitted
    let targetUrl = "https://studio.genlayer.com/api";
    if (endpoint && typeof endpoint === "string") {
      const trimmed = endpoint.trim();
      if (ALLOWED_RPC_ENDPOINTS.has(trimmed)) {
        targetUrl = trimmed;
      }
    } else if (process.env.NEXT_PUBLIC_GENLAYER_RPC_URL) {
      targetUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
    }

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
        "User-Agent": "HaltLayer-Vercel-Proxy",
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
