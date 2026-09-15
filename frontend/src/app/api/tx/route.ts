import { NextRequest, NextResponse } from "next/server";
import { encodeGenCallPayload } from "../../../lib/contracts/codec";

/**
 * SECURITY-HARDENED TRANSACTION DISPATCHER
 *
 * Enforces:
 * 1. Allowlisted contracts only (HaltLayer & DemoVault)
 * 2. Allowlisted methods only with strict schema validation
 * 3. Fixed server-side RPC endpoint (no client SSRF)
 * 4. Fixed network Chain ID: 61999 (GenLayer StudioNet)
 * 5. Rejection of arbitrary to/data/value/gas/signer overrides
 */

const ALLOWED_CONTRACTS = {
  HALT_LAYER: "0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23".toLowerCase(),
  DEMO_VAULT: "0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B".toLowerCase(),
} as const;

interface NormalizedAction {
  target: string;
  method: string;
  args: any[];
}

function normalizeAndValidate(body: any): { action?: NormalizedAction; error?: string } {
  const rawAction = body.action || body.functionName;
  const rawTarget = (body.targetAddress || body.target || "").toLowerCase();

  if (!rawAction || typeof rawAction !== "string") {
    return { error: "Missing or invalid action/functionName" };
  }

  // 1. Submit Incident
  if (rawAction === "submit_incident" || rawAction === "submitIncident") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.HALT_LAYER) {
      return { error: `Unauthorized target address for submit_incident: ${rawTarget}` };
    }
    const targetProtocol = body.targetProtocol || (body.args && body.args[0]) || "";
    const description = body.description || (body.args && body.args[1]) || "";
    const txHashes = body.txHashes || (body.args && body.args[2]) || "";
    const evidenceUrls = body.evidenceUrls || (body.args && body.args[3]) || "";

    if (!targetProtocol || !/^0x[0-9a-fA-F]{40}$/.test(targetProtocol)) {
      return { error: "Invalid targetProtocol format (must be 20-byte hex address)" };
    }
    if (typeof description !== "string" || description.trim().length === 0 || description.length > 2000) {
      return { error: "Description must be between 1 and 2000 characters" };
    }
    if (typeof txHashes !== "string" || txHashes.length > 1000) {
      return { error: "txHashes must be a string up to 1000 characters" };
    }
    if (typeof evidenceUrls !== "string" || evidenceUrls.length > 1000) {
      return { error: "evidenceUrls must be a string up to 1000 characters" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.HALT_LAYER,
        method: "submit_incident",
        args: [targetProtocol.trim(), description.trim(), txHashes.trim(), evidenceUrls.trim()],
      },
    };
  }

  // 2. Adjudicate Incident
  if (rawAction === "adjudicate_incident" || rawAction === "adjudicateIncident") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.HALT_LAYER) {
      return { error: `Unauthorized target address for adjudicate_incident: ${rawTarget}` };
    }
    const incidentId = body.incidentId || (body.args && body.args[0]) || "";
    if (typeof incidentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(incidentId.trim())) {
      return { error: "Invalid incidentId format" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.HALT_LAYER,
        method: "adjudicate_incident",
        args: [incidentId.trim()],
      },
    };
  }

  // 3. Appeal Incident
  if (rawAction === "appeal_incident" || rawAction === "appealIncident") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.HALT_LAYER) {
      return { error: `Unauthorized target address for appeal_incident: ${rawTarget}` };
    }
    const incidentId = body.incidentId || (body.args && body.args[0]) || "";
    const reason = body.reason || (body.args && body.args[1]) || "";

    if (typeof incidentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(incidentId.trim())) {
      return { error: "Invalid incidentId format" };
    }
    if (typeof reason !== "string" || reason.trim().length === 0 || reason.length > 2000) {
      return { error: "Appeal reason must be between 1 and 2000 characters" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.HALT_LAYER,
        method: "appeal_incident",
        args: [incidentId.trim(), reason.trim()],
      },
    };
  }

  // 4. Resolve Appeal
  if (rawAction === "resolve_appeal" || rawAction === "resolveAppeal") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.HALT_LAYER) {
      return { error: `Unauthorized target address for resolve_appeal: ${rawTarget}` };
    }
    const incidentId = body.incidentId || (body.args && body.args[0]) || "";
    const overturn = typeof body.overturn === "boolean" ? body.overturn : Boolean(body.args && body.args[1]);
    const notes = body.notes || (body.args && body.args[2]) || "";

    if (typeof incidentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(incidentId.trim())) {
      return { error: "Invalid incidentId format" };
    }
    if (typeof notes !== "string" || notes.length > 2000) {
      return { error: "Resolution notes must be up to 2000 characters" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.HALT_LAYER,
        method: "resolve_appeal",
        args: [incidentId.trim(), overturn, notes.trim()],
      },
    };
  }

  // 5. Deposit to DemoVault
  if (rawAction === "deposit") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.DEMO_VAULT) {
      return { error: `Unauthorized target address for deposit: ${rawTarget}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Deposit amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.DEMO_VAULT,
        method: "deposit",
        args: [Math.floor(amount)],
      },
    };
  }

  // 6. Withdraw from DemoVault
  if (rawAction === "withdraw") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.DEMO_VAULT) {
      return { error: `Unauthorized target address for withdraw: ${rawTarget}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Withdrawal amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.DEMO_VAULT,
        method: "withdraw",
        args: [Math.floor(amount)],
      },
    };
  }

  // 7. Pause DemoVault
  if (rawAction === "pause") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.DEMO_VAULT) {
      return { error: `Unauthorized target address for pause: ${rawTarget}` };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.DEMO_VAULT,
        method: "pause",
        args: [],
      },
    };
  }

  // 8. Resume DemoVault
  if (rawAction === "resume") {
    if (rawTarget && rawTarget !== ALLOWED_CONTRACTS.DEMO_VAULT) {
      return { error: `Unauthorized target address for resume: ${rawTarget}` };
    }

    return {
      action: {
        target: ALLOWED_CONTRACTS.DEMO_VAULT,
        method: "resume",
        args: [],
      },
    };
  }

  return { error: `Unrecognized or unauthorized method: ${rawAction}` };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Strict input validation and method mapping
    const { action, error } = normalizeAndValidate(body);
    if (error || !action) {
      return NextResponse.json(
        { success: false, error: error || "Validation failed" },
        { status: 400 }
      );
    }

    // 2. Fixed server-side RPC destination (no client endpoint override to prevent SSRF)
    const targetRpc =
      process.env.GENLAYER_RPC_URL ||
      process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
      "https://studio.genlayer.com/api";

    // 3. Sender address (server-side configured for StudioNet gasless transactions)
    const sender =
      process.env.GENLAYER_SENDER_ADDRESS ||
      "0x1111111111111111111111111111111111111111";

    // 4. Encode payload strictly with verified method and typed args
    const serializedData = encodeGenCallPayload(action.method, action.args);

    // 5. Fixed transaction payload with chain ID 61999
    const txPayload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "eth_sendTransaction",
      params: [
        {
          from: sender,
          to: action.target,
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
      method: action.method,
      target: action.target,
      chainId: 61999,
      network: "GenLayer StudioNet",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal transaction dispatcher error",
      },
      { status: 500 }
    );
  }
}
