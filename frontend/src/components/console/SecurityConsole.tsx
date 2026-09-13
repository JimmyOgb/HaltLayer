"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { HaltBanner } from "./HaltBanner";
import { ProtocolStatusCard } from "./ProtocolStatusCard";
import { IncidentList } from "./IncidentList";
import { IncidentReportModal } from "./IncidentReportModal";
import { IncidentDetailModal } from "./IncidentDetailModal";
import { AppealModal } from "./AppealModal";
import { LiveVaultControls } from "./LiveVaultControls";
import { Incident } from "../../lib/contracts/types";
import { AlertCircle, ShieldAlert, Cpu, CheckCircle2, Server } from "lucide-react";

export const SecurityConsole: React.FC = () => {
  const { state, demoVaultAddress, transactions } = useProtocol();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLiveControlsOpen, setIsLiveControlsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [appealIncidentTarget, setAppealIncidentTarget] = useState<Incident | null>(null);

  const vault = state.demoVault;
  const protocol = state.haltLayer.protocols[demoVaultAddress];

  const isHalted = Boolean(
    vault?.is_paused || protocol?.protection_status === "HALTED"
  );

  // Find the active incident triggering the halt if any
  const triggeringIncident = state.haltLayer.incidents.find(
    (i) => i.status === "HALT_ACCEPTED" || i.status === "FINAL_HALT" || i.status === "APPEALED"
  );

  return (
    <div className="py-8 space-y-8">
      {/* Live Blockchain Disconnect or Warning State */}
      {!state.network.connected && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Network RPC Unreachable ({state.network.rpcUrl}). Verify network configuration or local validator node.
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-sans">
            Contracts require active RPC connection
          </span>
        </div>
      )}

      {/* Live In-Flight Transaction Banners */}
      {transactions.length > 0 && transactions[0].status === "pending" && (
        <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 text-xs font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>GenLayer Consensus In-Flight: {transactions[0].message}</span>
          </div>
          <span className="text-[11px] text-gray-400">
            Tx {transactions[0].hash.slice(0, 10)}...
          </span>
        </div>
      )}

      {/* Emergency Halt Banner (Section 8: Most Visually Important State) */}
      {isHalted && (
        <HaltBanner
          protocolName={protocol?.name || "DemoVault"}
          targetAddress={demoVaultAddress}
          incident={triggeringIncident}
          onAppealClick={() => {
            if (triggeringIncident) {
              setAppealIncidentTarget(triggeringIncident);
            }
          }}
        />
      )}

      {/* Protocol Status Card & Security Metrics */}
      <ProtocolStatusCard
        onReportClick={() => setIsReportModalOpen(true)}
        onDepositWithdrawClick={() => setIsLiveControlsOpen(true)}
      />

      {/* Incidents Activity Ledger */}
      <div id="incidents-section">
        <IncidentList
          incidents={state.haltLayer.incidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onAppealClick={(inc) => setAppealIncidentTarget(inc)}
        />
      </div>

      {/* Modals */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultTarget={demoVaultAddress}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onAppealClick={(inc) => setAppealIncidentTarget(inc)}
      />

      <AppealModal
        incident={appealIncidentTarget}
        isOpen={Boolean(appealIncidentTarget)}
        onClose={() => setAppealIncidentTarget(null)}
      />

      <LiveVaultControls
        isOpen={isLiveControlsOpen}
        onClose={() => setIsLiveControlsOpen(false)}
      />
    </div>
  );
};
