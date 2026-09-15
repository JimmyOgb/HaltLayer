"use client";

import React, { useState } from "react";
import { HaltWordmark } from "../brand/HaltWordmark";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { NetworkModal } from "./NetworkModal";
import { WalletSafetyModal } from "./WalletSafetyModal";
import {
  Globe,
  Wallet,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface HeaderProps {
  currentTab: "console" | "incidents" | "how-it-works";
  onSelectTab: (tab: "console" | "incidents" | "how-it-works") => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const {
    state,
    walletAddress,
    chainId,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
    switchToGenLayerNetwork,
    refreshState,
  } = useProtocol();

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const isConnected = state.network.connected;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090E]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onSelectTab("console")}
              className="text-left focus:outline-none cursor-pointer"
            >
              <HaltWordmark size="md" subtitle={false} />
            </button>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => onSelectTab("console")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentTab === "console"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Console
              </button>
              <button
                onClick={() => onSelectTab("incidents")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === "incidents"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>Incidents</span>
                {state.haltLayer.incidentCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                    {state.haltLayer.incidentCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onSelectTab("how-it-works")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  currentTab === "how-it-works"
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                How It Works
              </button>
            </nav>
          </div>

          {/* Right controls: Network, Refresh, Wallet */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Refresh State Button */}
            <button
              onClick={() => refreshState()}
              disabled={state.isRefreshing}
              title="Refresh contract state from blockchain"
              className="p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${state.isRefreshing ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>

            {/* Network Indicator / Switcher */}
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                isConnected
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/50"
                  : "border-rose-500/30 bg-rose-950/20 text-rose-400 hover:border-rose-500/50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="hidden sm:inline capitalize">
                {state.network.name.replace("_", " ")}
              </span>
              <Settings className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Wrong Network Banner Button if wallet is on incorrect chain */}
            {walletAddress && !isCorrectChain && (
              <button
                onClick={switchToGenLayerNetwork}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer animate-pulse"
                title="Click to switch wallet to GenLayer StudioNet (Chain ID: 61999)"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Switch Chain (61999)</span>
                <span className="sm:hidden">Switch</span>
              </button>
            )}

            {/* Wallet Connect / Account Control */}
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={disconnectWallet}
                  title="Connected to GenLayer StudioNet. Click to disconnect."
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 font-mono text-xs hover:border-cyan-500/50 transition-colors cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSafetyModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-gray-300" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around border-t border-white/5 py-2 px-4 font-mono text-xs bg-black/40">
          <button
            onClick={() => onSelectTab("console")}
            className={`px-3 py-1 rounded ${
              currentTab === "console" ? "text-cyan-400 font-bold" : "text-gray-400"
            }`}
          >
            Console
          </button>
          <button
            onClick={() => onSelectTab("incidents")}
            className={`px-3 py-1 rounded ${
              currentTab === "incidents" ? "text-cyan-400 font-bold" : "text-gray-400"
            }`}
          >
            Incidents ({state.haltLayer.incidentCount})
          </button>
          <button
            onClick={() => onSelectTab("how-it-works")}
            className={`px-3 py-1 rounded ${
              currentTab === "how-it-works" ? "text-cyan-400 font-bold" : "text-gray-400"
            }`}
          >
            How It Works
          </button>
        </div>
      </header>

      {/* Network & Config Modal */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />

      {/* Wallet Safety & Connection Explanatory Modal */}
      <WalletSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onConnect={connectWallet}
      />
    </>
  );
};
