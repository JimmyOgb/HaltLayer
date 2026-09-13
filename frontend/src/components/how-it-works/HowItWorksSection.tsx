"use client";

import React from "react";
import { Eye, Search, Cpu, Zap, ShieldCheck } from "lucide-react";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "OBSERVE",
      subtitle: "Autonomous Detection & Ingestion",
      icon: Eye,
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgGlow: "bg-blue-500/5",
      description:
        "Evidence can be submitted by users, security researchers, or autonomous monitoring agents. Submissions include malicious transaction hashes and external threat intelligence URLs.",
      technicalDetail:
        "Public submit_incident() entrypoint accepts verifiable on-chain anomaly markers with zero barrier to entry.",
    },
    {
      number: "02",
      title: "INVESTIGATE",
      subtitle: "Nondeterministic Retrieval & Analysis",
      icon: Search,
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgGlow: "bg-amber-500/5",
      description:
        "HaltLayer retrieves and interprets external evidence. GenLayer leader node fetches real-time web telemetry and runs an LLM model to analyze the exploit pattern against the protocol safety policy.",
      technicalDetail:
        "Uses gl.nondet.web.get and gl.nondet.exec_prompt to produce a structured threat assessment without violating determinism.",
    },
    {
      number: "03",
      title: "CONSENSUS",
      subtitle: "The Equivalence Principle",
      icon: Cpu,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      bgGlow: "bg-cyan-500/5",
      description:
        "GenLayer validators independently evaluate the substantive threat assessment against protocol invariants. Consensus verifies the target match, danger score, and evidence quality floor.",
      technicalDetail:
        "Independent validator_fn checks target identity, policy capabilities, severity thresholds, and exploit pattern heuristics.",
    },
    {
      number: "04",
      title: "INTERVENE",
      subtitle: "Cross-Contract Circuit Tripping",
      icon: Zap,
      color: "text-rose-400",
      borderColor: "border-rose-500/30",
      bgGlow: "bg-rose-500/5",
      description:
        "If the protection policy is satisfied, HaltLayer invokes the authorized circuit breaker. The transaction transitions the incident state to HALT_ACCEPTED and calls the target protocol pause hook.",
      technicalDetail:
        "Cross-contract target_contract.emit(on='accepted').pause() executes deterministically on-chain.",
    },
    {
      number: "05",
      title: "PROTECT",
      subtitle: "Reserves Preserved & Appeal Workflow",
      icon: ShieldCheck,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgGlow: "bg-emerald-500/5",
      description:
        "The target protocol enters a safe state. Unauthorized withdrawals and attacker exploit loops immediately revert on-chain. False positives are prevented through a decentralized appeal mechanism.",
      technicalDetail:
        "DemoVault blocks withdrawals while paused. Protocol owner can appeal with verified patch to safely resume operations.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase mb-3">
            ARCHITECTURE & CONSENSUS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            How HaltLayer Protects Protocols
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            A 5-stage autonomous security loop that bridges subjective threat telemetry with
            decentralized, deterministic blockchain safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className={`relative p-6 rounded-2xl border ${s.borderColor} ${s.bgGlow} bg-[#0A0E18]/60 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${
                  idx === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-white/20">
                      {s.number}
                    </span>
                    <div className={`p-2.5 rounded-xl border ${s.borderColor} bg-white/[0.03] ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-mono text-lg font-bold text-white mb-1">
                    {s.title}
                  </h3>
                  <div className={`text-xs font-mono font-medium ${s.color} mb-3`}>
                    {s.subtitle}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    {s.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-gray-400 bg-white/[0.01] -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <span className="text-gray-500 mr-1.5 font-bold">Tech:</span>
                  {s.technicalDetail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
