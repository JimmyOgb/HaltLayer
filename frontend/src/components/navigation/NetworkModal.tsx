"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import { X, Globe, Radio, Server, Check, AlertCircle } from "lucide-react";

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkModal: React.FC<NetworkModalProps> = ({ isOpen, onClose }) => {
  const {
    state,
    networkName,
    rpcUrl,
    haltLayerAddress,
    demoVaultAddress,
    walletAddress,
    isCorrectChain,
    switchToGenLayerNetwork,
    setNetwork,
    setContractAddresses,
    refreshState,
  } = useProtocol();

  const [selectedNetwork, setSelectedNetwork] = useState(networkName);
  const [customRpc, setCustomRpc] = useState(rpcUrl);
  const [haltAddr, setHaltAddr] = useState(haltLayerAddress);
  const [vaultAddr, setVaultAddr] = useState(demoVaultAddress);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      name: "studio_next",
      label: "GenLayer Studio Next (Active)",
      url: "https://studio-next.genlayer.com/api",
      chainId: 61997,
      desc: "GenLayer Consensus v0.6 network, fee-funded policy (Chain ID: 61997)",
    },
    {
      name: "studionet",
      label: "GenLayer StudioNet (Fallback)",
      url: "https://studio.genlayer.com/api",
      chainId: 61999,
      desc: "Historical StudioNet fallback deployment (Chain ID: 61999)",
    },
    {
      name: "testnet_bradbury",
      label: "Testnet Bradbury",
      url: "https://testnet-bradbury.genlayer.foundation",
      chainId: 4221,
      desc: "Public validator testnet network (Chain ID: 4221)",
    },
    {
      name: "localnet",
      label: "Localnet (GenLayer Studio)",
      url: "http://127.0.0.1:4000/api",
      chainId: 61997,
      desc: "Local validator cluster running via genlayer up (Chain ID: 61997)",
    },
  ];

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setSelectedNetwork(preset.name);
    setCustomRpc(preset.url);
  };

  const handleSave = () => {
    setNetwork(selectedNetwork, customRpc);
    setContractAddresses(haltAddr, vaultAddr);
    if (selectedNetwork === "studio_next" && walletAddress && !isCorrectChain) {
      switchToGenLayerNetwork().catch((e) => console.warn("Network switch prompt:", e));
    }
    refreshState();
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: customRpc,
          method: "net_version",
          params: [],
        }),
      });
      const data = await res.json();
      if (data.result || res.ok) {
        setTestResult("Connected successfully!");
      } else {
        setTestResult(`RPC Error: ${data.error?.message || "Unknown error"}`);
      }
    } catch (e: any) {
      setTestResult(`Connection Failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0D121D] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">Network & Contract Config</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs font-mono">
          {/* Preset Networks */}
          <div>
            <label className="block text-gray-400 mb-2 font-semibold">Select Network</label>
            <div className="space-y-2">
              {presets.map((p) => {
                const active = selectedNetwork === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      active
                        ? "bg-cyan-950/40 border-cyan-500/50 text-white"
                        : "bg-white/[0.02] border-white/5 text-gray-300 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <span>{p.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[11px] text-gray-400 font-sans mt-0.5">{p.desc}</div>
                    </div>
                    <span className="text-[10px] text-gray-400 px-2 py-1 rounded bg-black/40 border border-white/5">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RPC URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-400 font-semibold">RPC Endpoint URL</label>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
            </div>
            <input
              type="text"
              value={customRpc}
              onChange={(e) => setCustomRpc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs"
              placeholder="https://..."
            />
            {testResult && (
              <div
                className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${
                  testResult.includes("successfully") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{testResult}</span>
              </div>
            )}
          </div>

          {/* Contract Addresses */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                HaltLayer Intelligent Contract Address
              </label>
              <input
                type="text"
                value={haltAddr}
                onChange={(e) => setHaltAddr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                DemoVault Target Contract Address
              </label>
              <input
                type="text"
                value={vaultAddr}
                onChange={(e) => setVaultAddr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                placeholder="0x..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono transition-colors cursor-pointer"
          >
            Apply & Reconnect
          </button>
        </div>
      </div>
    </div>
  );
};
