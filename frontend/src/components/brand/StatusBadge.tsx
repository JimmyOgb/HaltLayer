import React from "react";
import {
  ProtectionStatus,
  IncidentStatus,
  ThreatSeverity,
  EvidenceQuality,
} from "../../lib/contracts/types";

interface StatusBadgeProps {
  type?: "protection" | "incident" | "severity" | "quality";
  status: string;
  size?: "sm" | "md" | "lg";
  pulsing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = "protection",
  status,
  size = "md",
  pulsing = true,
}) => {
  const norm = status?.toUpperCase() || "";

  // Dimensions
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 tracking-wider",
    md: "text-xs px-2.5 py-1 tracking-wider",
    lg: "text-sm px-3.5 py-1.5 tracking-widest",
  };

  let colorClasses = "bg-gray-800/60 text-gray-300 border-gray-700/60";
  let dotColor = "bg-gray-400";
  let showPulse = false;

  if (type === "protection") {
    switch (norm) {
      case "ACTIVE":
        colorClasses =
          "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_-2px_rgba(16,185,129,0.25)]";
        dotColor = "bg-emerald-400";
        showPulse = pulsing;
        break;
      case "HALTED":
        colorClasses =
          "bg-rose-950/60 text-rose-400 border-rose-500/50 shadow-[0_0_16px_-2px_rgba(244,63,94,0.4)]";
        dotColor = "bg-rose-500";
        showPulse = pulsing;
        break;
      case "SAFE_MODE":
        colorClasses =
          "bg-cyan-950/40 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_-2px_rgba(6,182,212,0.25)]";
        dotColor = "bg-cyan-400";
        showPulse = pulsing;
        break;
      case "UNDER_INVESTIGATION":
        colorClasses =
          "bg-amber-950/50 text-amber-400 border-amber-500/40 shadow-[0_0_14px_-2px_rgba(245,158,11,0.3)]";
        dotColor = "bg-amber-400";
        showPulse = pulsing;
        break;
      case "NOT_CONFIGURED":
      case "UNAVAILABLE":
        colorClasses = "bg-zinc-900/80 text-zinc-400 border-zinc-700/60";
        dotColor = "bg-zinc-500";
        showPulse = false;
        break;
      default:
        colorClasses = "bg-slate-900/60 text-slate-400 border-slate-700/50";
        dotColor = "bg-slate-500";
    }
  } else if (type === "incident") {
    switch (norm) {
      case "HALT_ACCEPTED":
      case "FINAL_HALT":
        colorClasses = "bg-rose-950/60 text-rose-300 border-rose-500/50";
        dotColor = "bg-rose-500";
        break;
      case "ADJUDICATING":
      case "SUBMITTED":
        colorClasses = "bg-amber-950/50 text-amber-300 border-amber-500/40";
        dotColor = "bg-amber-400";
        showPulse = pulsing;
        break;
      case "APPEALED":
        colorClasses = "bg-purple-950/50 text-purple-300 border-purple-500/40";
        dotColor = "bg-purple-400";
        showPulse = pulsing;
        break;
      case "RESOLVED_RESUME":
        colorClasses = "bg-emerald-950/40 text-emerald-300 border-emerald-500/40";
        dotColor = "bg-emerald-400";
        break;
      case "REJECTED":
        colorClasses = "bg-gray-800/60 text-gray-400 border-gray-700/60";
        dotColor = "bg-gray-500";
        break;
    }
  } else if (type === "severity") {
    switch (norm) {
      case "CRITICAL":
        colorClasses = "bg-red-950/70 text-red-300 border-red-500/60 font-semibold";
        dotColor = "bg-red-500";
        break;
      case "HIGH":
        colorClasses = "bg-orange-950/60 text-orange-300 border-orange-500/50";
        dotColor = "bg-orange-400";
        break;
      case "MEDIUM":
        colorClasses = "bg-yellow-950/50 text-yellow-300 border-yellow-500/40";
        dotColor = "bg-yellow-400";
        break;
      case "LOW":
        colorClasses = "bg-blue-950/40 text-blue-300 border-blue-500/30";
        dotColor = "bg-blue-400";
        break;
      default:
        colorClasses = "bg-gray-800/40 text-gray-400 border-gray-700/40";
        dotColor = "bg-gray-500";
    }
  } else if (type === "quality") {
    switch (norm) {
      case "STRONG":
        colorClasses = "bg-teal-950/50 text-teal-300 border-teal-500/40";
        dotColor = "bg-teal-400";
        break;
      case "MODERATE":
        colorClasses = "bg-sky-950/40 text-sky-300 border-sky-500/30";
        dotColor = "bg-sky-400";
        break;
      default:
        colorClasses = "bg-slate-800/40 text-slate-400 border-slate-700/40";
        dotColor = "bg-slate-500";
    }
  }

  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase rounded-full border backdrop-blur-sm ${sizeClasses[size]} ${colorClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {showPulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label}
    </span>
  );
};
