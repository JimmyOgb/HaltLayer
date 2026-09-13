"use client";

import React, { useState } from "react";
import { Incident } from "../../lib/contracts/types";
import { StatusBadge } from "../brand/StatusBadge";
import { InvestigationVisualizer } from "./InvestigationVisualizer";
import { X, ExternalLink, Copy, Check, ShieldAlert, Cpu, RotateCcw } from "lucide-react";

interface IncidentDetailModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onAppealClick: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  isOpen,
  onClose,
  onAppealClick,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121D] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">
              Incident Dossier: {incident.incident_id}
            </h3>
            <StatusBadge type="incident" status={incident.status} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs font-mono">
          {/* Visual State Representation */}
          <InvestigationVisualizer incident={incident} />

          {/* Core Telemetry Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-gray-500 block mb-1">Target Protocol</span>
              <span className="text-white font-semibold truncate block">
                {incident.target_address}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-gray-500 block mb-1">Reported By</span>
              <span className="text-gray-300 truncate block">
                {incident.reporter}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-gray-500 block mb-1">Threat Severity</span>
              <div className="mt-1">
                <StatusBadge type="severity" status={incident.threat_severity || "none"} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-gray-500 block mb-1">Evidence Quality</span>
              <div className="mt-1">
                <StatusBadge type="quality" status={incident.evidence_quality || "weak"} size="sm" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-gray-400 font-bold block mb-1.5">Anomaly Narrative:</span>
            <div className="p-4 rounded-xl border border-white/5 bg-black/40 text-gray-200 font-sans leading-relaxed text-sm">
              {incident.description}
            </div>
          </div>

          {/* Transaction Hashes */}
          {incident.tx_hashes && (
            <div>
              <span className="text-gray-400 font-bold block mb-1.5">Suspicious Transactions:</span>
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/40">
                <code className="text-cyan-300 text-xs truncate max-w-md">
                  {incident.tx_hashes}
                </code>
                <button
                  onClick={() => handleCopy(incident.tx_hashes)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5"
                >
                  {copiedHash === incident.tx_hashes ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedHash === incident.tx_hashes ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Evidence URLs */}
          {incident.evidence_urls && (
            <div>
              <span className="text-gray-400 font-bold block mb-1.5">External Evidence URLs:</span>
              <div className="p-3 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between">
                <span className="text-gray-300 truncate max-w-md">
                  {incident.evidence_urls}
                </span>
                <a
                  href={incident.evidence_urls}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>
              </div>
            </div>
          )}

          {/* Appeal Information (if present) */}
          {incident.appeal_reason && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <span className="text-purple-300 font-bold block">Appeal Statement:</span>
              <p className="text-gray-300 font-sans text-xs">{incident.appeal_reason}</p>
              {incident.appeal_resolution && (
                <div className="pt-2 border-t border-white/10 text-emerald-400">
                  <span className="font-bold mr-1">Determination:</span>
                  <span>{incident.appeal_resolution}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {incident.status === "HALT_ACCEPTED" ? (
              <button
                onClick={() => {
                  onClose();
                  onAppealClick(incident);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-950/50 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>File Formal Appeal</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
