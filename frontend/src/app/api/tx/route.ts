import { NextRequest, NextResponse } from "next/server";
import { encodeGenCallPayload } from "../../../lib/contracts/codec";

const ALLOWED_FUNCTIONS = new Set([
  "register_protocol",
  "submit_incident",
  "adjudicate_incident",
  "appeal_incident",
  "resolve_appeal",
  "deposit",
  "withdraw",
  "pause",
  "resume",
  "activate_safe_mode",
  "set_circuit_breaker",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, targetAddress, functionName, args } = body;

    // Security Audit: Input validation & allowlist
    if (!functionName || !ALLOWED_FUNCTIONS.has(functionName)) {
      return NextResponse.json(
        { success: false, error: `Invalid or unauthorized contract method: ${functionName}` },
        { status: 400 }
      );
    }

    if (!targetAddress || !/^0x[0-9a-fA-F]{40}$/.test(targetAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid target contract address format (must be 20-byte hex)" },
        { status: 400 }
      );
    }

    const targetRpc =
      endpoint ||
      process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
      "https://studio.genlayer.com/api";

    const sender =
      process.env.GENLAYER_SENDER_ADDRESS ||
      "0x1111111111111111111111111111111111111111";

    // Encode payload with GenLayer calldata & RLP
    const serializedData = encodeGenCallPayload(functionName, args || []);

    // Dispatch to GenLayer JSON-RPC
    const txPayload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "eth_sendTransaction",
      params: [
        {
          from: sender,
          to: targetAddress,
          data: serializedData,
          gas: "0x100000",
        },
      ],
    };

    let txHash: string | null = null;
    let rpcErrorMessage: string | null = null;

    try {
      const response = await fetch(targetRpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txPayload),
      });

      const resJson = await response.json();
      if (resJson.result) {
        txHash = resJson.result;
      } else if (resJson.error) {
        rpcErrorMessage = resJson.error.message || `RPC error ${resJson.error.code}`;
      }
    } catch (e: any) {
      rpcErrorMessage = e.message || "Failed to reach GenLayer RPC node";
    }

    // No-Mock Audit: Never fabricate a fake transaction hash if rejected
    if (!txHash) {
      return NextResponse.json(
        {
          success: false,
          error: rpcErrorMessage || "Transaction rejected by GenLayer node",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash,
      method: functionName,
      target: targetAddress,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to process transaction request",
      },
      { status: 500 }
    );
  }
}
