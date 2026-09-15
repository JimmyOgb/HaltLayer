"use client";

import React, { useState } from "react";
import { Incident } from "../../lib/contracts/types";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { X, RotateCcw, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import {
  TransactionConfirmModal,
  TransactionReviewData,
} from "./TransactionConfirmModal";

interface AppealModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const { appealIncident, resolveAppeal, haltLayerAddress } = useProtocol();

  const [appealReason, setAppealReason] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<TransactionReviewData | null>(null);

  if (!isOpen || !incident) return null;

  const isHaltAccepted = incident.status === "HALT_ACCEPTED";
  const isAppealed = incident.status === "APPEALED";

  const handleFileAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      setError("Please provide verified counter-evidence or patch documentation.");
      return;
    }

    setPendingTx({
      targetAddress: haltLayerAddress,
      contractName: "HaltLayer (Autonomous Circuit Breaker)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: "appeal_incident",
      purpose: `Submit formal mitigation appeal for incident ${incident.incident_id} to Security Council.`,
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: `Transitions incident ${incident.incident_id} state to APPEALED.`,
      onConfirm: async () => {
        setIsSubmitting(true);
        setError(null);
        try {
          await appealIncident(incident.incident_id, appealReason.trim());
          onClose();
        } catch (err: any) {
          setError(err?.message || "Failed to file appeal");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleResolve = (overturn: boolean) => {
    const finalNotes =
      resolutionNotes.trim() ||
      (overturn
        ? "Vulnerability audited and mitigated. Normal operations approved."
        : "Exploit threat verified. Permanent circuit-breaker halt upheld.");

    setPendingTx({
      targetAddress: haltLayerAddress,
      contractName: "HaltLayer (Autonomous Circuit Breaker)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: "resolve_appeal",
      purpose: overturn
        ? `Overturn halt on incident ${incident.incident_id} and resume DemoVault operations.`
        : `Uphold emergency halt on incident ${incident.incident_id} as permanent security measure.`,
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: overturn
        ? `Transitions incident ${incident.incident_id} to RESOLVED_RESUME and safely resumes DemoVault.`
        : `Transitions incident ${incident.incident_id} to FINAL_HALT (permanent circuit trip).`,
      onConfirm: async () => {
        setIsSubmitting(true);
        setError(null);
        try {
          await resolveAppeal(incident.incident_id, overturn, finalNotes);
          onClose();
        } catch (err: any) {
          setError(err?.message || "Failed to resolve appeal");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0D121D] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-purple-950/20">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-purple-400" />
              <h3 className="font-mono font-bold text-white text-base">
                Decentralized Appeal & Resolution: {incident.incident_id}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lifecycle Flow Graphic */}
          <div className="p-5 bg-white/[0.02] border-b border-white/5">
            <div className="text-[10px] font-mono uppercase text-gray-400 mb-2">
              Incident State Lifecycle:
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span
                className={`px-2 py-1 rounded border ${
                  incident.status === "HALT_ACCEPTED"
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                1. HALT ACCEPTED
              </span>
              <span className="text-gray-600">→</span>
              <span
                className={`px-2 py-1 rounded border ${
                  incident.status === "APPEALED"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold"
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                2. APPEALED
              </span>
              <span className="text-gray-600">→</span>
              <span
                className={`px-2 py-1 rounded border ${
                  incident.status === "RESOLVED_RESUME"
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                    : incident.status === "FINAL_HALT"
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                3. RESOLVED
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs font-mono">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Incident Details Summary */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 space-y-1">
              <div className="text-gray-400">
                <span className="text-gray-500">Incident: </span>
                <span className="text-white font-semibold">{incident.description}</span>
              </div>
              <div className="text-gray-400">
                <span className="text-gray-500">Adjudication: </span>
                <span className="text-rose-300">{incident.adjudication_reason}</span>
              </div>
            </div>

            {/* If incident is currently HALT_ACCEPTED -> Allow filing appeal */}
            {isHaltAccepted && (
              <form onSubmit={handleFileAppeal} className="space-y-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Appeal Justification & Mitigation Proof *
                  </label>
                  <textarea
                    rows={3}
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="State the root-cause fix, security audit report link, or false-positive counter-evidence..."
                    required
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-purple-500 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold transition-colors shadow-[0_0_16px_-3px_rgba(168,85,247,0.4)] cursor-pointer"
                  >
                    {isSubmitting ? "Reviewing..." : "Review & Submit Appeal"}
                  </button>
                </div>
              </form>
            )}

            {/* If incident is APPEALED -> Security Council / Owner Resolution */}
            {isAppealed && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20">
                  <span className="text-purple-400 font-bold block mb-1">Appellant Statement:</span>
                  <span className="text-gray-200">{incident.appeal_reason || "Mitigation submitted."}</span>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Council Determination Notes
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Notes for resolution determination..."
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleResolve(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Overturn & Resume Vault</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleResolve(false)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Uphold Final Halt</span>
                  </button>
                </div>
              </div>
            )}

            {/* If already resolved */}
            {!isHaltAccepted && !isAppealed && (
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-center space-y-1">
                <span className="text-gray-400 block">Current Status: {incident.status}</span>
                <span className="text-emerald-400 block font-semibold">
                  {incident.appeal_resolution || "Determination finalized."}
                </span>
              </div>
            )}
          </div>
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
