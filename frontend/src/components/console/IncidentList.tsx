"use client";

import React, { useState } from "react";
import { Incident } from "../../lib/contracts/types";
import { StatusBadge } from "../brand/StatusBadge";
import { useProtocol } from "../../lib/context/ProtocolContext";
import {
  FileText,
  ExternalLink,
  ChevronRight,
  Cpu,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  TransactionConfirmModal,
  TransactionReviewData,
} from "./TransactionConfirmModal";

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onAppealClick: (incident: Incident) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onSelectIncident,
  onAppealClick,
}) => {
  const { adjudicateIncident, haltLayerAddress } = useProtocol();
  const [adjudicatingId, setAdjudicatingId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionReviewData | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleAdjudicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingTx({
      targetAddress: haltLayerAddress,
      contractName: "HaltLayer (Autonomous Circuit Breaker)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: "adjudicate_incident",
      purpose: `Trigger multi-validator consensus on GenLayer to evaluate evidence for incident ${id}.`,
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: `Executes nondeterministic analysis and updates incident ${id} to either HALT_ACCEPTED or REJECTED.`,
      onConfirm: async () => {
        setAdjudicatingId(id);
        try {
          await adjudicateIncident(id);
        } catch (err) {
          console.error(err);
        } finally {
          setAdjudicatingId(null);
        }
      },
    });
  };

  if (!incidents || incidents.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0C101B]/80 backdrop-blur-md p-10 text-center">
        <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <h4 className="font-mono text-sm font-bold text-gray-300 mb-1">
          No Incidents Recorded On-Chain
        </h4>
        <p className="text-xs text-gray-400 font-sans max-w-md mx-auto leading-relaxed">
          The contract has no reported security incidents. Submit an incident to test GenLayer
          autonomous consensus and emergency protection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#0C101B]/80 backdrop-blur-md overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Incident Activity Ledger ({incidents.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-gray-400">
            State retrieved from HaltLayer contract
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {incidents.map((inc) => {
            const isAdjudicable = inc.status === "SUBMITTED" || inc.status === "ADJUDICATING";
            const isHaltAccepted = inc.status === "HALT_ACCEPTED";

            return (
              <div
                key={inc.incident_id}
                onClick={() => onSelectIncident(inc)}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col gap-3"
              >
                {/* Row 1: ID, Status, Severity, Quality */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-cyan-400">
                      {inc.incident_id}
                    </span>
                    <StatusBadge type="incident" status={inc.status} size="sm" />
                    {inc.threat_severity && inc.threat_severity !== "none" && (
                      <StatusBadge type="severity" status={inc.threat_severity} size="sm" />
                    )}
                    {inc.evidence_quality && (
                      <StatusBadge type="quality" status={inc.evidence_quality} size="sm" />
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-gray-400">
                    {inc.submitted_at || "On-Chain"}
                  </div>
                </div>

                {/* Row 2: Description */}
                <p className="text-xs sm:text-sm text-gray-200 font-sans leading-relaxed">
                  {inc.description}
                </p>

                {/* Row 3: Technical Details: Target, Tx, Action, Adjudication */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5 text-[11px] font-mono text-gray-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div>
                      <span className="text-gray-500">Target: </span>
                      <span className="text-gray-300">
                        {inc.target_address ? `${inc.target_address.slice(0, 8)}...${inc.target_address.slice(-6)}` : "Unknown"}
                      </span>
                    </div>

                    {inc.tx_hashes && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Tx: </span>
                        <span className="text-gray-300">{inc.tx_hashes.slice(0, 10)}...</span>
                        <button
                          onClick={(e) => handleCopy(inc.tx_hashes, e)}
                          title="Copy Tx Hash"
                          className="text-gray-500 hover:text-white"
                        >
                          {copiedHash === inc.tx_hashes ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {inc.recommended_action && inc.recommended_action !== "NO_ACTION" && (
                      <div>
                        <span className="text-gray-500">Action: </span>
                        <span className="text-rose-400 font-bold">{inc.recommended_action}</span>
                      </div>
                    )}
                  </div>

                  {/* Inline Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isAdjudicable && (
                      <button
                        onClick={(e) => handleAdjudicate(inc.incident_id, e)}
                        disabled={adjudicatingId === inc.incident_id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{adjudicatingId === inc.incident_id ? "Adjudicating..." : "Run Consensus"}</span>
                      </button>
                    )}

                    {isHaltAccepted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppealClick(inc);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Appeal</span>
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Confirmation Modal (Rule 13) */}
      <TransactionConfirmModal
        data={pendingTx}
        isOpen={Boolean(pendingTx)}
        onClose={() => setPendingTx(null)}
      />
    </>
  );
};
