"use client";

import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, ExternalLink, ArrowRight } from "lucide-react";

export interface TransactionReviewData {
  targetAddress: string;
  contractName: string;
  networkName: string;
  chainId: number;
  methodName: string;
  purpose: string;
  value: string;
  changesState: boolean;
  stateEffect: string;
  onConfirm: () => Promise<void>;
}

interface TransactionConfirmModalProps {
  data: TransactionReviewData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  data,
  isOpen,
  onClose,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      await data.onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Transaction authorization failed or reverted");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#0D121D] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-cyan-950/20">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                Transaction Review & Authorization
              </h3>
              <p className="text-[11px] text-gray-400 font-sans">
                Review transaction parameters before signing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Notice */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-sans">
              Verified Allowlisted Target. No token approvals or transfers requested.
            </span>
          </div>

          {/* Details Table */}
          <div className="rounded-xl border border-white/10 bg-black/40 divide-y divide-white/5 overflow-hidden">
            {/* Target Contract */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-gray-400">Target Contract:</span>
              <div className="text-right">
                <span className="text-white font-bold block">{data.contractName}</span>
                <span className="text-gray-400 text-[11px] font-mono">{data.targetAddress}</span>
              </div>
            </div>

            {/* Network & Chain ID */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-gray-400">Network & Chain ID:</span>
              <div className="text-right">
                <span className="text-cyan-300 font-semibold">{data.networkName}</span>
                <span className="text-gray-400 text-[11px] block">Chain ID: {data.chainId}</span>
              </div>
            </div>

            {/* Method */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-gray-400">Method Name:</span>
              <span className="text-amber-300 font-bold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                {data.methodName}()
              </span>
            </div>

            {/* Value */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-gray-400">Transaction Value:</span>
              <span className="text-emerald-400 font-semibold">{data.value}</span>
            </div>

            {/* Purpose */}
            <div className="p-3">
              <span className="text-gray-400 block mb-1">Purpose:</span>
              <p className="text-gray-200 font-sans text-xs leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                {data.purpose}
              </p>
            </div>

            {/* Protocol State Impact */}
            <div className="p-3 flex items-center justify-between">
              <span className="text-gray-400">State Modification:</span>
              <span
                className={`font-semibold ${
                  data.changesState ? "text-amber-400" : "text-gray-400"
                }`}
              >
                {data.changesState ? "Yes — Updates On-Chain State" : "Read-Only"}
              </span>
            </div>

            {data.changesState && (
              <div className="p-3 bg-amber-950/10">
                <span className="text-gray-400 block mb-1">State Effect:</span>
                <span className="text-gray-300 font-sans text-[11px]">{data.stateEffect}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isExecuting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-[0_0_16px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting to GenLayer...</span>
                </>
              ) : (
                <>
                  <span>Authorize & Execute</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
