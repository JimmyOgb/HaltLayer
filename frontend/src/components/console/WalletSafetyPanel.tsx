"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import {
  ShieldCheck,
  Lock,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  Wallet,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const WalletSafetyPanel: React.FC = () => {
  const {
    walletAddress,
    chainId,
    isCorrectChain,
    disconnectWallet,
    connectWallet,
    switchToGenLayerNetwork,
    haltLayerAddress,
    demoVaultAddress,
  } = useProtocol();

  const [copiedHalt, setCopiedHalt] = useState(false);
  const [copiedVault, setCopiedVault] = useState(false);

  const copyToClipboard = (text: string, isHalt: boolean) => {
    navigator.clipboard.writeText(text);
    if (isHalt) {
      setCopiedHalt(true);
      setTimeout(() => setCopiedHalt(false), 2000);
    } else {
      setCopiedVault(true);
      setTimeout(() => setCopiedVault(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C101B]/80 backdrop-blur-md p-6 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-white text-sm">
              HaltLayer Wallet Safety & Architecture
            </h3>
            <p className="text-gray-400 text-xs font-sans">
              Non-custodial transparency and safety rules
            </p>
          </div>
        </div>

        {/* Connection / Disconnect Status */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </span>
              <button
                onClick={disconnectWallet}
                className="px-3 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-xs transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-xs">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Read-Only Mode Active</span>
              </span>
              <button
                onClick={() => connectWallet()}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Network Mismatch Alert */}
      {walletAddress && !isCorrectChain && (
        <div className="mb-4 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Connected to Chain ID {chainId || "Unknown"} — GenLayer Studio Next (Chain ID: 61997) is required.
            </span>
          </div>
          <button
            onClick={switchToGenLayerNetwork}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors cursor-pointer"
          >
            Switch to GenLayer Studio Next
          </button>
        </div>
      )}

      {/* Core Safety Declarations (Phase 3 Required Statements) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs font-mono">
        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-200 font-sans">
            <strong className="text-white font-mono">Read-only mode</strong> is available without connecting a wallet.
          </span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-200 font-sans">
            <strong className="text-white font-mono">Connecting a wallet</strong> is only required for user-authorized write actions.
          </span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-200 font-sans">
            <strong className="text-white font-mono">Never share</strong> your private key or seed phrase. HaltLayer will never ask for them.
          </span>
        </div>

        <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-200 font-sans">
            <strong className="text-white font-mono">Every transaction</strong> will show target contract, method, network, and value before signing.
          </span>
        </div>
      </div>

      {/* Network & Contract Verification Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs font-mono">
        {/* Network & Chain ID */}
        <div className="p-3 rounded-xl border border-white/5 bg-black/40">
          <span className="text-gray-400 text-[10px] uppercase block mb-1">Verified Network</span>
          <span className="text-white font-bold block">GenLayer Studio Next</span>
          <span className="text-cyan-400 text-[11px] block mt-0.5">Chain ID: 61997 (0xf22d)</span>
        </div>

        {/* HaltLayer Contract */}
        <div className="p-3 rounded-xl border border-white/5 bg-black/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-[10px] uppercase block">HaltLayer Contract</span>
            <button
              onClick={() => copyToClipboard(haltLayerAddress, true)}
              className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px]"
            >
              {copiedHalt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHalt ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <span className="text-white font-bold block">Autonomous Circuit Breaker</span>
          <span className="text-gray-400 text-[11px] block truncate mt-0.5 font-mono">
            {haltLayerAddress}
          </span>
        </div>

        {/* DemoVault Contract */}
        <div className="p-3 rounded-xl border border-white/5 bg-black/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-[10px] uppercase block">DemoVault Target Contract</span>
            <button
              onClick={() => copyToClipboard(demoVaultAddress, false)}
              className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px]"
            >
              {copiedVault ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedVault ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <span className="text-white font-bold block">Protected Vault Reserve</span>
          <span className="text-gray-400 text-[11px] block truncate mt-0.5 font-mono">
            {demoVaultAddress}
          </span>
        </div>
      </div>
    </div>
  );
};
