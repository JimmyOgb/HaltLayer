"use client";

import React from "react";
import { X, ShieldCheck, Wallet, Lock, CheckCircle2, ArrowRight } from "lucide-react";

interface WalletSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => Promise<void>;
}

export const WalletSafetyModal: React.FC<WalletSafetyModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  if (!isOpen) return null;

  const handleProceedConnect = async () => {
    onClose();
    await onConnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0D121D] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-cyan-950/20">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">
              Wallet Connection Notice
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          <p className="text-gray-300 font-sans text-sm leading-relaxed">
            HaltLayer is a decentralized circuit breaker deployed on <strong>GenLayer StudioNet</strong>.
            Please review our security guarantees before connecting your wallet:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="font-sans text-gray-200">
                <strong className="text-white font-mono block">Read-Only By Default:</strong>
                All dashboards, incidents, consensus status, and telemetry can be inspected without connecting.
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="font-sans text-gray-200">
                <strong className="text-white font-mono block">Zero Token Approvals:</strong>
                HaltLayer never requests ERC20 approvals, unlimited allowances, permit2, or asset transfers.
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="font-sans text-gray-200">
                <strong className="text-white font-mono block">Verified Target Contracts:</strong>
                Interactions are strictly restricted to HaltLayer (<code>0x6ec1...BB45</code>) and DemoVault (<code>0x30B4...d0F9</code>).
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-3">
              <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="font-sans text-gray-200">
                <strong className="text-white font-mono block">Verified Network:</strong>
                GenLayer Studio Next (Chain ID: <code>61997</code> / <code>0xf22d</code>).
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Continue in Read-Only
            </button>
            <button
              onClick={handleProceedConnect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors shadow-[0_0_16px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
