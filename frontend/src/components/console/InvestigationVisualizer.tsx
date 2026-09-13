"use client";

import React from "react";
import { Incident } from "../../lib/contracts/types";
import { Search, ShieldAlert, Cpu, CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";

interface InvestigationVisualizerProps {
  incident: Incident;
}

export const InvestigationVisualizer: React.FC<InvestigationVisualizerProps> = ({ incident }) => {
  const isPending = incident.status === "SUBMITTED" || incident.status === "ADJUDICATING";
  const isAccepted = incident.status === "HALT_ACCEPTED" || incident.status === "FINAL_HALT";
  const isRejected = incident.status === "REJECTED";
  const isAppealed = incident.status === "APPEALED";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0E18]/80 backdrop-blur-md p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            GenLayer Consensus Investigation Flow
          </h4>
        </div>
        <span className="font-mono text-xs text-gray-400">
          Incident {incident.incident_id}
        </span>
      </div>

      {/* Visual Pipeline */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
        {/* Stage 1: Evidence Ingestion */}
        <div className="flex-1 w-full flex flex-col items-center text-center p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="w-10 h-10 rounded-full bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs font-bold text-white">1. Threat Evidence</span>
          <span className="text-[11px] text-gray-400 mt-1 truncate max-w-[180px]">
            {incident.tx_hashes ? `${incident.tx_hashes.slice(0, 10)}...` : "Telemetry provided"}
          </span>
        </div>

        <div className="hidden md:block text-gray-600 font-mono">→</div>

        {/* Stage 2: Leader Nondeterministic Analysis */}
        <div className="flex-1 w-full flex flex-col items-center text-center p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="w-10 h-10 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Search className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs font-bold text-white">2. Leader Retrieval</span>
          <span className="text-[11px] text-gray-400 mt-1">Web telemetry + LLM reasoning</span>
        </div>

        <div className="hidden md:block text-gray-600 font-mono">→</div>

        {/* Stage 3: Equivalence Principle Consensus */}
        <div className="flex-1 w-full flex flex-col items-center text-center p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_16px_-3px_rgba(6,182,212,0.2)]">
          <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-2">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs font-bold text-cyan-300">3. Validator Consensus</span>
          <span className="text-[11px] text-cyan-200/70 mt-1">Invariant verification</span>
        </div>

        <div className="hidden md:block text-gray-600 font-mono">→</div>

        {/* Stage 4: On-Chain Action */}
        <div
          className={`flex-1 w-full flex flex-col items-center text-center p-4 rounded-xl border ${
            isAccepted
              ? "border-rose-500/50 bg-rose-950/30 text-rose-300"
              : isRejected
              ? "border-gray-600/40 bg-gray-900/40 text-gray-400"
              : isPending
              ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
              : "border-purple-500/40 bg-purple-950/20 text-purple-300"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-black/40 border border-current flex items-center justify-center mb-2">
            {isAccepted ? (
              <Zap className="w-5 h-5 text-rose-400" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5 text-gray-400" />
            ) : isPending ? (
              <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            )}
          </div>
          <span className="font-mono text-xs font-bold">4. Action State</span>
          <span className="text-[11px] mt-1 font-mono uppercase">
            {isAccepted ? "CIRCUIT TRIPPED" : isRejected ? "REJECTED" : isPending ? "ADJUDICATING" : "APPEALED"}
          </span>
        </div>
      </div>

      {/* Adjudication Reason / Outcome */}
      {incident.adjudication_reason && (
        <div className="mt-5 p-3.5 rounded-xl border border-white/10 bg-black/30 text-xs font-mono">
          <span className="text-gray-400 font-bold mr-2">Reasoning Invariant:</span>
          <span className="text-gray-200">{incident.adjudication_reason}</span>
        </div>
      )}
    </div>
  );
};
