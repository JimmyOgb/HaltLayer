import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, method, params } = body;

    const targetUrl =
      endpoint ||
      process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
      "https://studio.genlayer.com/api";

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
