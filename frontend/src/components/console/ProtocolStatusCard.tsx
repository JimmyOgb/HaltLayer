"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { StatusBadge } from "../brand/StatusBadge";
import { HaltLogo } from "../brand/HaltLogo";
import {
  Shield,
  Lock,
  Unlock,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface ProtocolStatusCardProps {
  onReportClick: () => void;
  onDepositWithdrawClick: () => void;
}

export const ProtocolStatusCard: React.FC<ProtocolStatusCardProps> = ({
  onReportClick,
  onDepositWithdrawClick,
}) => {
  const { state, demoVaultAddress, haltLayerAddress } = useProtocol();
  const vault = state.demoVault;
  const protocol = state.haltLayer.protocols[demoVaultAddress];

  // Determine true status
  const isConfigured =
    demoVaultAddress &&
    demoVaultAddress !== "0x0000000000000000000000000000000000000000";

  const protectionStatus = !isConfigured
    ? "NOT_CONFIGURED"
    : protocol?.protection_status
    ? protocol.protection_status
    : vault !== null
    ? vault.is_paused
      ? "HALTED"
      : "ACTIVE"
    : "UNAVAILABLE";

  const totalStaked = vault !== null ? vault.total_staked : null;
  const isPaused = vault !== null ? vault.is_paused : (protectionStatus === "HALTED");
  const isSafeMode = vault !== null ? vault.is_safe_mode : (protectionStatus === "SAFE_MODE");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary Target Protocol Card (DemoVault) */}
      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0C101B]/80 backdrop-blur-md p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
        {/* Subtle background glow */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${
            isPaused
              ? "bg-rose-500/10"
              : isSafeMode
              ? "bg-cyan-500/10"
              : "bg-emerald-500/10"
          }`}
        />

        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isPaused
                    ? "border-rose-500/30 bg-rose-950/30 text-rose-400"
                    : "border-emerald-500/30 bg-emerald-950/30 text-emerald-400"
                }`}
              >
                {isPaused ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-xl font-bold text-white">
                    {protocol?.name || "DemoVault (Lending Reserve)"}
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  {demoVaultAddress.slice(0, 10)}...{demoVaultAddress.slice(-8)}
                </span>
              </div>
            </div>

            <StatusBadge type="protection" status={protectionStatus} size="md" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                Total Reserve Value
              </span>
              <span className="font-mono text-lg sm:text-xl font-bold text-white flex items-center">
                {totalStaked !== null ? (
                  <>
                    <span className="text-emerald-400 text-sm mr-0.5">$</span>
                    {totalStaked.toLocaleString()}
                    <span className="text-xs text-gray-400 ml-1 font-normal">USD</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm font-normal">Unavailable</span>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                Circuit-Breaker
              </span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-cyan-300 truncate block">
                {haltLayerAddress && haltLayerAddress !== "0x0000000000000000000000000000000000000000"
                  ? `${haltLayerAddress.slice(0, 6)}...${haltLayerAddress.slice(-4)}`
                  : "Not Configured"}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">HaltLayer Authorized</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                Execution State
              </span>
              <span
                className={`font-mono text-xs sm:text-sm font-bold block ${
                  isPaused ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {isPaused ? "WITHDRAWALS BLOCKED" : "NORMAL OPERATIONS"}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {isPaused ? "Reverts on-chain" : "Unrestricted"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onDepositWithdrawClick}
              className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Vault Defense</span>
            </button>
          </div>

          <button
            onClick={onReportClick}
            className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Submit Threat Report</span>
          </button>
        </div>
      </div>

      {/* Security Overview Metrics Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0C101B]/80 backdrop-blur-md p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="font-mono text-xs font-bold text-gray-300 uppercase tracking-wider">
              Security Overview
            </h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Protected Protocols</span>
              <span className="font-mono text-sm font-bold text-white">
                {state.haltLayer.protocolCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Total Incident Reports</span>
              <span className="font-mono text-sm font-bold text-white">
                {state.haltLayer.incidentCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Active Investigations</span>
              <span className="font-mono text-sm font-bold text-amber-400">
                {
                  state.haltLayer.incidents.filter(
                    (i) => i.status === "ADJUDICATING" || i.status === "APPEALED"
                  ).length
                }
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Equivalence Principle Invariants</span>
              <span className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enforced</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-gray-400 bg-black/20 -mx-6 -mb-6 p-4 rounded-b-2xl">
          <div className="text-gray-500 mb-1 font-bold">Consensus Rule:</div>
          <div>Strict non-destructive leader analysis verified independently by multi-validator consensus.</div>
        </div>
      </div>
    </div>
  );
};
