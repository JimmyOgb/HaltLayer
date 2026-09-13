"use client";

import React from "react";
import { HaltLogo } from "../brand/HaltLogo";
import { Incident } from "../../lib/contracts/types";
import { AlertOctagon, ShieldAlert, FileText, ArrowRight, ExternalLink } from "lucide-react";

interface HaltBannerProps {
  protocolName: string;
  targetAddress: string;
  incident?: Incident | null;
  onAppealClick: () => void;
}

export const HaltBanner: React.FC<HaltBannerProps> = ({
  protocolName,
  targetAddress,
  incident,
  onAppealClick,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/50 bg-gradient-to-r from-[#170B10] via-[#1F0E17] to-[#12080D] p-6 sm:p-8 shadow-[0_0_40px_-5px_rgba(255,51,85,0.25)] transition-all duration-500">
      {/* Subtle pulsing accent glow behind shield */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          {/* Halted Tripped Breaker Shield */}
          <div className="relative flex-shrink-0">
            <HaltLogo size={68} variant="halted" animated={true} />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 border-2 border-black" />
            </span>
          </div>

          {/* Core Alert Details */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold tracking-wider">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>CIRCUIT BREAKER ACTIVATED</span>
              </span>
              <span className="text-gray-400 font-mono text-xs hidden sm:inline">
                {targetAddress.slice(0, 8)}...{targetAddress.slice(-6)}
              </span>
            </div>

            <h2 className="font-mono text-2xl sm:text-3xl font-black tracking-wide text-white mb-2">
              PROTOCOL HALTED: <span className="text-rose-400">{protocolName}</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Autonomous protection triggered by GenLayer validator consensus. All asset withdrawals,
              deposits, and vulnerable interactions are immediately frozen to prevent reserve drainage.
            </p>

            {incident && (
              <div className="mt-4 p-3.5 rounded-xl border border-rose-500/20 bg-black/40 text-xs font-mono space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-rose-300 font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Incident {incident.incident_id}:</span>
                  <span className="text-white font-normal truncate max-w-md">
                    {incident.description}
                  </span>
                </div>

                <div className="text-gray-400 text-[11px] flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/5">
                  <div>
                    <span className="text-gray-500">Threat Severity: </span>
                    <span className="text-rose-400 font-bold uppercase">{incident.threat_severity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Adjudication: </span>
                    <span className="text-gray-300">{incident.adjudication_reason}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Action: </span>
                    <span className="text-rose-400 uppercase font-bold">{incident.recommended_action}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto flex-shrink-0">
          <button
            onClick={onAppealClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-black font-mono font-bold text-xs transition-all shadow-[0_0_20px_-3px_rgba(255,51,85,0.4)] cursor-pointer"
          >
            <span>File Formal Appeal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
