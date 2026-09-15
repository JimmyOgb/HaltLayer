import { NextRequest, NextResponse } from "next/server";
import { createClient, createAccount } from "genlayer-js";
import * as chains from "genlayer-js/chains";
import { generatePrivateKey } from "viem/accounts";

/**
 * Production Studio Next Transaction Dispatcher
 *
 * Security Invariants Enforced (PRIORITY 7):
 * 1. Strictly allowlisted contracts (HaltLayer & DemoVault on Studio Next)
 * 2. Strictly allowlisted methods (submit_incident, adjudicate_incident, appeal_incident, resolve_appeal, deposit, withdraw, pause, resume)
 * 3. Rigorous validation of all method arguments
 * 4. Rejection of arbitrary target address (to)
 * 5. Rejection of arbitrary calldata/data payloads
 * 6. Rejection of arbitrary value overrides
 * 7. Rejection of client-specified RPC endpoints (pinned to Studio Next)
 * 8. Rejection of signer credentials (no private keys/secrets accepted from client)
 * 9. Old StudioNet contracts strictly prohibited from being targeted
 * 10. Official GenLayer SDK chain definition (chains.studioDevnet, Chain ID 61997 / 0xf22d)
 */

const STUDIO_NEXT_HALT = "0x6ec1051FD327B1D06Efc0F752CF9565C2806BB45".toLowerCase();
const STUDIO_NEXT_VAULT = "0x30B4aa8F89692B4128a3501Cb057cE15b0b9d0F9".toLowerCase();

const OLD_STUDIONET_HALT = "0xB363DC3E1d34b4D8AbAb0B9452C4a93352C91A23".toLowerCase();
const OLD_STUDIONET_VAULT = "0x76a379E6e11dd6E10F13De2b7356F62a4a693d1B".toLowerCase();

const FIXED_RPC_URL = "https://studio-next.genlayer.com/api";
const CHAIN_ID = 61997;

function isHaltLayerTarget(addr: string): boolean {
  return addr.toLowerCase().trim() === STUDIO_NEXT_HALT;
}

function isDemoVaultTarget(addr: string): boolean {
  return addr.toLowerCase().trim() === STUDIO_NEXT_VAULT;
}

interface NormalizedAction {
  target: string;
  method: string;
  args: any[];
}

function normalizeAndValidate(body: any): { action?: NormalizedAction; error?: string } {
  // 1. Reject signer credentials injection
  if (body.privateKey || body.signer || body.secret || body.key || body.seed || body.mnemonic) {
    return { error: "Security violation: Passing signer credentials to the server is strictly forbidden" };
  }

  // 2. Reject arbitrary RPC endpoint overrides
  if (body.endpoint || body.rpcUrl || body.rpc || body.targetRpc) {
    return { error: "Security violation: Client-specified RPC endpoints are strictly forbidden" };
  }

  // 3. Reject arbitrary calldata payloads
  if (body.calldata !== undefined || body.data !== undefined || body.payload !== undefined) {
    return { error: "Security violation: Arbitrary calldata or raw data payloads are strictly prohibited" };
  }

  // 4. Reject arbitrary transaction value
  if (body.value !== undefined && body.value !== 0 && body.value !== "0") {
    return { error: "Security violation: Non-zero transaction value is not accepted" };
  }

  const rawAction = body.action || body.functionName;
  const rawTarget = (body.targetAddress || body.target || "").toLowerCase().trim();

  if (!rawAction || typeof rawAction !== "string") {
    return { error: "Missing or invalid action/functionName" };
  }

  // 5. Explicitly reject old StudioNet contract targets
  if (rawTarget === OLD_STUDIONET_HALT || rawTarget === OLD_STUDIONET_VAULT) {
    return {
      error: `Security violation: Target ${rawTarget} is an old StudioNet contract. All transactions must target production Studio Next contracts (${STUDIO_NEXT_HALT} or ${STUDIO_NEXT_VAULT}).`,
    };
  }

  // 6. Validate methods and arguments against allowlisted contracts

  // Method: submit_incident (HaltLayer)
  if (rawAction === "submit_incident" || rawAction === "submitIncident") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
      return { error: `Unauthorized target address for submit_incident: ${rawTarget}. Expected ${STUDIO_NEXT_HALT}` };
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
        target: STUDIO_NEXT_HALT,
        method: "submit_incident",
        args: [targetProtocol.trim(), description.trim(), txHashes.trim(), evidenceUrls.trim()],
      },
    };
  }

  // Method: adjudicate_incident (HaltLayer)
  if (rawAction === "adjudicate_incident" || rawAction === "adjudicateIncident") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
      return { error: `Unauthorized target address for adjudicate_incident: ${rawTarget}. Expected ${STUDIO_NEXT_HALT}` };
    }
    const incidentId = body.incidentId || (body.args && body.args[0]) || "";
    if (typeof incidentId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(incidentId.trim())) {
      return { error: "Invalid incidentId format (must be 1-64 alphanumeric characters, dash, or underscore)" };
    }

    return {
      action: {
        target: STUDIO_NEXT_HALT,
        method: "adjudicate_incident",
        args: [incidentId.trim()],
      },
    };
  }

  // Method: appeal_incident (HaltLayer)
  if (rawAction === "appeal_incident" || rawAction === "appealIncident") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
      return { error: `Unauthorized target address for appeal_incident: ${rawTarget}. Expected ${STUDIO_NEXT_HALT}` };
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
        target: STUDIO_NEXT_HALT,
        method: "appeal_incident",
        args: [incidentId.trim(), reason.trim()],
      },
    };
  }

  // Method: resolve_appeal (HaltLayer)
  if (rawAction === "resolve_appeal" || rawAction === "resolveAppeal") {
    if (rawTarget && !isHaltLayerTarget(rawTarget)) {
      return { error: `Unauthorized target address for resolve_appeal: ${rawTarget}. Expected ${STUDIO_NEXT_HALT}` };
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
        target: STUDIO_NEXT_HALT,
        method: "resolve_appeal",
        args: [incidentId.trim(), overturn, notes.trim()],
      },
    };
  }

  // Method: deposit (DemoVault)
  if (rawAction === "deposit") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for deposit: ${rawTarget}. Expected ${STUDIO_NEXT_VAULT}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Deposit amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: STUDIO_NEXT_VAULT,
        method: "deposit",
        args: [Math.floor(amount)],
      },
    };
  }

  // Method: withdraw (DemoVault)
  if (rawAction === "withdraw") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for withdraw: ${rawTarget}. Expected ${STUDIO_NEXT_VAULT}` };
    }
    const amount = Number(body.amount !== undefined ? body.amount : (body.args && body.args[0]));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return { error: "Withdrawal amount must be a positive number up to 100,000,000" };
    }

    return {
      action: {
        target: STUDIO_NEXT_VAULT,
        method: "withdraw",
        args: [Math.floor(amount)],
      },
    };
  }

  // Method: pause (DemoVault)
  if (rawAction === "pause") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for pause: ${rawTarget}. Expected ${STUDIO_NEXT_VAULT}` };
    }

    return {
      action: {
        target: STUDIO_NEXT_VAULT,
        method: "pause",
        args: [],
      },
    };
  }

  // Method: resume (DemoVault)
  if (rawAction === "resume") {
    if (rawTarget && !isDemoVaultTarget(rawTarget)) {
      return { error: `Unauthorized target address for resume: ${rawTarget}. Expected ${STUDIO_NEXT_VAULT}` };
    }

    return {
      action: {
        target: STUDIO_NEXT_VAULT,
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

    // 1. Strict input validation, address allowlisting, and method mapping
    const { action, error } = normalizeAndValidate(body);
    if (error || !action) {
      return NextResponse.json(
        { success: false, error: error || "Validation failed" },
        { status: 400 }
      );
    }

    // 2. Fixed server-side RPC destination (SSRF protection: https://studio-next.genlayer.com/api)
    const targetRpc = FIXED_RPC_URL;
    const chainId = CHAIN_ID;
    const networkName = "Studio Next";

    // 3. Official GenLayer SDK chain definition for chain 61997
    const privateKey = (process.env.GENLAYER_RELAY_PRIVATE_KEY || generatePrivateKey()) as `0x${string}`;
    const account = createAccount(privateKey);
    const baseChain = chains.studioDevnet;
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
