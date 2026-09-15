import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  chains,
  createAccount,
  generatePrivateKey,
} from "genlayer-js";

/**
 * SECURITY-HARDENED TRANSACTION DISPATCHER
 *
 * Enforces:
 * 1. Allowlisted contracts only (Studio Next & StudioNet Fallback)
 * 2. Allowlisted methods only with strict schema validation
 * 3. Fixed server-side RPC endpoint (no client SSRF)
 * 4. Pinned Studio Next network (Chain ID: 61997 / 0xf22d) with StudioNet fallback
 * 5. Rejection of arbitrary to/data/value/gas/signer overrides
 */

const STUDIO_NEXT_HALT = "0x6ec1051FD327B1D06Efc0F752CF9565C2806BB45".toLowerCase();
const STUDIO_NEXT_VAULT = "0x30B4aa8F89692B4128a3501Cb057cE15b0b9d0F9".toLowerCase();
const STUDIONET_FALLBACK_HALT = "0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23".toLowerCase();
const STUDIONET_FALLBACK_VAULT = "0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B".toLowerCase();

function isHaltLayerTarget(addr: string): boolean {
  const clean = addr.toLowerCase().trim();
  const envAddr = (process.env.NEXT_PUBLIC_HALT_LAYER_ADDRESS || "").toLowerCase().trim();
  return clean === STUDIO_NEXT_HALT || clean === STUDIONET_FALLBACK_HALT || (Boolean(envAddr) && clean === envAddr);
}

function isDemoVaultTarget(addr: string): boolean {
  const clean = addr.toLowerCase().trim();
  const envAddr = (process.env.NEXT_PUBLIC_DEMO_VAULT_ADDRESS || "").toLowerCase().trim();
  return clean === STUDIO_NEXT_VAULT || clean === STUDIONET_FALLBACK_VAULT || (Boolean(envAddr) && clean === envAddr);
}

function getDefaultHaltLayer(): string {
  return process.env.NEXT_PUBLIC_HALT_LAYER_ADDRESS || STUDIO_NEXT_HALT;
}

function getDefaultDemoVault(): string {
  return process.env.NEXT_PUBLIC_DEMO_VAULT_ADDRESS || STUDIO_NEXT_VAULT;
}

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
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
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
        target: rawTarget || getDefaultHaltLayer(),
        method: "submit_incident",
        args: [targetProtocol.trim(), description.trim(), txHashes.trim(), evidenceUrls.trim()],
      },
    };
  }

  // 2. Adjudicate Incident
  if (rawAction === "adjudicate_incident" || rawAction === "adjudicateIncident") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
      return { error: `Unauthorized target address for adjudicate_incident: ${rawTarget}` };
    }
    const incidentId = body.incidentId || (body.args && body.args[0]) || "";
    if (typeof incidentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(incidentId.trim())) {
      return { error: "Invalid incidentId format" };
    }

    return {
      action: {
        target: rawTarget || getDefaultHaltLayer(),
        method: "adjudicate_incident",
        args: [incidentId.trim()],
      },
    };
  }

  // 3. Appeal Incident
  if (rawAction === "appeal_incident" || rawAction === "appealIncident") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
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
        target: rawTarget || getDefaultHaltLayer(),
        method: "appeal_incident",
        args: [incidentId.trim(), reason.trim()],
      },
    };
  }

  // 4. Resolve Appeal
  if (rawAction === "resolve_appeal" || rawAction === "resolveAppeal") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
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
        target: rawTarget || getDefaultHaltLayer(),
        method: "resolve_appeal",
        args: [incidentId.trim(), overturn, notes.trim()],
      },
    };
  }

  // 5. Deposit to DemoVault
  if (rawAction === "deposit") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for deposit: ${rawTarget}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Deposit amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: rawTarget || getDefaultDemoVault(),
        method: "deposit",
        args: [Math.floor(amount)],
      },
    };
  }

  // 6. Withdraw from DemoVault
  if (rawAction === "withdraw") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for withdraw: ${rawTarget}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Withdrawal amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: rawTarget || getDefaultDemoVault(),
        method: "withdraw",
        args: [Math.floor(amount)],
      },
    };
  }

  // 7. Pause DemoVault
  if (rawAction === "pause") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for pause: ${rawTarget}` };
    }

    return {
      action: {
        target: rawTarget || getDefaultDemoVault(),
        method: "pause",
        args: [],
      },
    };
  }

  // 8. Resume DemoVault
  if (rawAction === "resume") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for resume: ${rawTarget}` };
    }

    return {
      action: {
        target: rawTarget || getDefaultDemoVault(),
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

    // 2. Fixed server-side RPC destination (SSRF protection)
    const targetRpc =
      process.env.GENLAYER_RPC_URL ||
      process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ||
      "https://studio-next.genlayer.com/api";

    const isStudioNext =
      targetRpc.includes("studio-next") ||
      targetRpc.includes("studio-dev") ||
      process.env.NEXT_PUBLIC_NETWORK_NAME === "studio_next";

    const chainId = isStudioNext ? 61997 : 61999;
    const networkName = isStudioNext ? "Studio Next" : "GenLayer StudioNet";

    const privateKey = (process.env.GENLAYER_RELAY_PRIVATE_KEY || generatePrivateKey()) as `0x${string}`;
    const account = createAccount(privateKey);
    const baseChain = isStudioNext ? chains.studioDevnet : chains.studionet;
    const chain = {
      ...baseChain,
      id: chainId,
      rpcUrls: { default: { http: [targetRpc] } },
    };
    const client = createClient({ chain, account });

    const fees = await client.estimateTransactionFees();
    const txHash = await client.writeContract({
      address: action.target as `0x${string}`,
      functionName: action.method,
      args: action.args,
      fees,
    });

    return NextResponse.json({
      success: true,
      txHash,
      method: action.method,
      target: action.target,
      chainId,
      network: networkName,
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
