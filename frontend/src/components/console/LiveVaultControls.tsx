"use client";

import React, { useState } from "react";
import { useProtocol } from "../../lib/context/ProtocolContext";
import {
  X,
  Lock,
  Unlock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldCheck,
} from "lucide-react";
import {
  TransactionConfirmModal,
  TransactionReviewData,
} from "./TransactionConfirmModal";

interface LiveVaultControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVaultControls: React.FC<LiveVaultControlsProps> = ({ isOpen, onClose }) => {
  const { state, demoVaultAddress, depositToVault, withdrawFromVault, toggleVaultPause } = useProtocol();
  const vault = state.demoVault;

  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review modal state (Rule 13)
  const [pendingTx, setPendingTx] = useState<TransactionReviewData | null>(null);

  if (!isOpen) return null;

  const isPaused = vault?.is_paused ?? false;
  const isSafeMode = vault?.is_safe_mode ?? false;

  const initiateDeposit = () => {
    setActionError(null);
    setActionSuccess(null);
    setPendingTx({
      targetAddress: demoVaultAddress,
      contractName: "DemoVault (Lending Reserve)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: "deposit",
      purpose: `Inject $${depositAmount.toLocaleString()} simulated liquidity into DemoVault reserves to test state updates.`,
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: `Increases DemoVault total staked reserves by $${depositAmount.toLocaleString()} and credits user balance.`,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const tx = await depositToVault(depositAmount);
          setActionSuccess(`Deposit confirmed on-chain: ${tx.slice(0, 12)}...`);
        } catch (err: any) {
          setActionError(err?.message || "Deposit transaction reverted on-chain");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const initiateWithdraw = () => {
    setActionError(null);
    setActionSuccess(null);
    setPendingTx({
      targetAddress: demoVaultAddress,
      contractName: "DemoVault (Lending Reserve)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: "withdraw",
      purpose: isPaused
        ? `Attempt withdrawal of $${withdrawAmount.toLocaleString()} to verify that paused circuit breaker blocks transactions on-chain.`
        : `Withdraw $${withdrawAmount.toLocaleString()} from DemoVault active balance.`,
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: isPaused
        ? "Transaction will revert on-chain with: 'Vault is paused: withdrawals disabled'."
        : `Decreases DemoVault balance by $${withdrawAmount.toLocaleString()}.`,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const tx = await withdrawFromVault(withdrawAmount);
          setActionSuccess(`Withdrawal confirmed on-chain: ${tx.slice(0, 12)}...`);
        } catch (err: any) {
          setActionError(err?.message || "Transaction reverted: Vault is paused: withdrawals disabled");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const initiateTogglePause = () => {
    setActionError(null);
    setActionSuccess(null);
    setPendingTx({
      targetAddress: demoVaultAddress,
      contractName: "DemoVault (Lending Reserve)",
      networkName: "GenLayer StudioNet",
      chainId: 61999,
      methodName: isPaused ? "resume" : "pause",
      purpose: isPaused
        ? "Resume DemoVault normal operations, unfreezing withdrawals."
        : "Activate manual emergency pause on DemoVault, blocking all withdrawals.",
      value: "0 GEN (Gasless on StudioNet)",
      changesState: true,
      stateEffect: isPaused
        ? "Transitions DemoVault is_paused to false (unrestricted withdrawals)."
        : "Transitions DemoVault is_paused to true (all withdrawals revert).",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const tx = await toggleVaultPause(!isPaused);
          setActionSuccess(`Vault state toggle confirmed on-chain: ${tx.slice(0, 12)}...`);
        } catch (err: any) {
          setActionError(err?.message || "Failed to update vault paused state");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0D121D] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono font-bold text-white text-base">Live Vault Defense Verification</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs font-mono">
            {/* Current State Indicator */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isPaused
                  ? "border-rose-500/40 bg-rose-950/20 text-rose-300"
                  : "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {isPaused ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
                <div>
                  <span className="font-bold block text-sm">
                    {isPaused ? "VAULT IS PAUSED (CIRCUIT BREAKER TRIPPED)" : "VAULT IS ACTIVE (NORMAL OPERATIONS)"}
                  </span>
                  <span className="text-[11px] text-gray-400 font-sans">
                    {isPaused
                      ? "Any withdrawal attempt is blocked and will revert on-chain."
                      : "Deposits and withdrawals are permitted."}
                  </span>
                </div>
              </div>

              <button
                onClick={initiateTogglePause}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-colors cursor-pointer ${
                  isPaused
                    ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
                    : "border-rose-500/50 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50"
                }`}
              >
                {isPaused ? "Manual Resume" : "Emergency Pause"}
              </button>
            </div>

            {/* Feedback messages */}
            {actionError && (
              <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Protection Action Verified:</span>
                  <span className="text-[11px] font-mono break-all">{actionError}</span>
                </div>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Test Operations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deposit Box */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white block mb-1">Test Deposit</span>
                  <span className="text-gray-400 text-[11px] font-sans block mb-3">
                    Simulates user liquidity injection.
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white mb-3"
                  />
                </div>

                <button
                  onClick={initiateDeposit}
                  disabled={isProcessing}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Deposit Funds</span>
                </button>
              </div>

              {/* Withdraw Box (The test of circuit breaker defense) */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white block mb-1">Test Withdrawal Defense</span>
                  <span className="text-gray-400 text-[11px] font-sans block mb-3">
                    Attempts withdrawal. Reverts if paused!
                  </span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white mb-3"
                  />
                </div>

                <button
                  onClick={initiateWithdraw}
                  disabled={isProcessing}
                  className={`w-full py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    isPaused
                      ? "bg-rose-500 hover:bg-rose-400 text-black shadow-[0_0_16px_-2px_rgba(255,51,85,0.4)]"
                      : "bg-cyan-500 hover:bg-cyan-400 text-black"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{isPaused ? "Attempt Withdrawal (Should Revert)" : "Withdraw Funds"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-semibold transition-colors"
            >
              Close
            </button>
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
