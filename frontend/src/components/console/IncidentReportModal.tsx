"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { X, ShieldAlert, AlertTriangle, Send, CheckCircle2, FileText, Info } from "lucide-react";
import {
  TransactionConfirmModal,
  TransactionReviewData,
} from "./TransactionConfirmModal";

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: string;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  defaultTarget = "",
}) => {
  const { submitIncident, demoVaultAddress, haltLayerAddress } = useProtocol();

  const [target, setTarget] = useState(defaultTarget || demoVaultAddress);
  const [description, setDescription] = useState("");
  const [txHashes, setTxHashes] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  // Review modal state (Rule 13)
  const [pendingTx, setPendingTx] = useState<TransactionReviewData | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessHash(null);

    if (!target.trim()) {
      setError("Target protocol address is required.");
      return;
    }
    if (!description.trim()) {
      setError("Incident description cannot be empty.");
      return;
    }

    setPendingTx({
      targetAddress: haltLayerAddress,
      contractName: "HaltLayer (Autonomous Circuit Breaker)",
      networkName: "GenLayer Studio Next",
      chainId: 61997,
      methodName: "submit_incident",
      purpose: `Submit incident threat report against ${target.trim().slice(0, 10)}... for GenLayer validator consensus evaluation.`,
      value: "Fee-funded by Studio Next policy (0 user cost)",
      changesState: true,
      stateEffect: "Appends a new pending incident record into HaltLayer ledger.",
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const tx = await submitIncident({
            target: target.trim(),
            description: description.trim(),
            txHashes: txHashes.trim(),
            evidenceUrls: evidenceUrls.trim(),
          });
          setSuccessHash(tx);
          setTimeout(() => {
            onClose();
            setDescription("");
            setTxHashes("");
            setEvidenceUrls("");
            setSuccessHash(null);
          }, 2000);
        } catch (err: any) {
          setError(err?.message || "Failed to submit incident report");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleFillDemoExploit = () => {
    setDescription("High-frequency anomalous recursive withdrawal pattern detected in reserve contract.");
    setTxHashes("0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b");
    setEvidenceUrls("https://raw.githubusercontent.com/genlayerlabs/genvm/main/README.md");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0D121D] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-rose-950/20">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="font-mono font-bold text-white text-base">Submit Threat Intelligence</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Informative Guidance Banner */}
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 text-xs text-gray-300 font-sans flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Consensus Rule: </span>
              Anyone can submit evidence. GenLayer independently evaluates the incident. If the threat
              satisfies the protocol&apos;s protection policy, HaltLayer can activate the circuit breaker.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successHash && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Incident submitted successfully! Tx: {successHash.slice(0, 14)}...</span>
              </div>
            )}

            {/* Quick Demo Fill Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFillDemoExploit}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Fill Sample Threat Telemetry
              </button>
            </div>

            {/* Target Protocol Address */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Target Protocol Address *
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0x..."
                required
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Incident Description */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Incident Description *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the anomalous transaction pattern, rapid balance drop, or threat signature..."
                required
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-rose-500 font-sans"
              />
            </div>

            {/* Transaction Hashes */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Suspicious Transaction Hashes
              </label>
              <input
                type="text"
                value={txHashes}
                onChange={(e) => setTxHashes(e.target.value)}
                placeholder="0x9a8b7c6d5e4f3a2b... (comma separated)"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Evidence URLs */}
            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                External Threat Intelligence URLs
              </label>
              <input
                type="text"
                value={evidenceUrls}
                onChange={(e) => setEvidenceUrls(e.target.value)}
                placeholder="https://raw.githubusercontent.com/... or https://security.alert/..."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-black font-semibold transition-colors shadow-[0_0_16px_-3px_rgba(244,63,94,0.4)] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Reviewing..." : "Review & Submit Incident"}</span>
              </button>
            </div>
          </form>
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
