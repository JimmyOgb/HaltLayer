"use client";

import React from "react";
import { HaltLogo } from "../brand/HaltLogo";
import {
  ShieldAlert,
  Search,
  Cpu,
  Zap,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface HeroSectionProps {
  onLaunchConsole: () => void;
  onHowItWorks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchConsole,
  onHowItWorks,
}) => {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 border-b border-white/[0.06]">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[400px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-mono tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GENLAYER AGENT TANK HACKATHON</span>
          </div>

          {/* Primary Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
            Autonomous protection for the{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-200 bg-clip-text text-transparent">
              agentic economy.
            </span>
          </h1>

          {/* Supporting Message */}
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto mb-10">
            HaltLayer turns real-world evidence and decentralized judgment into autonomous
            protocol protection. Powered by GenLayer Intelligent Contracts and the
            Equivalence Principle.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onLaunchConsole}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-sm transition-all shadow-[0_0_24px_-4px_rgba(0,240,168,0.4)] hover:shadow-[0_0_32px_-2px_rgba(0,240,168,0.6)] cursor-pointer"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onHowItWorks}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              <span>How It Works</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Elegant Flow Pipeline Visual */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="text-xs font-mono tracking-widest text-gray-400 uppercase text-center mb-4">
            Autonomous Defense Pipeline
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#090D15]/80 backdrop-blur-md shadow-2xl relative">
            {/* Step 1: Evidence */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold text-white">Evidence</span>
              <span className="text-[10px] text-gray-400 mt-1">Exploit signal & tx hash</span>
            </div>

            {/* Step 2: Investigation */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold text-white">Investigation</span>
              <span className="text-[10px] text-gray-400 mt-1">Web retrieval & analysis</span>
            </div>

            {/* Step 3: GenLayer Consensus */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/30 transition-colors shadow-[0_0_16px_-4px_rgba(6,182,212,0.2)]">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-2">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold text-cyan-300">GenLayer Consensus</span>
              <span className="text-[10px] text-cyan-200/70 mt-1">Equivalence Principle</span>
            </div>

            {/* Step 4: Protection Action */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold text-white">Protection Action</span>
              <span className="text-[10px] text-gray-400 mt-1">Circuit breaker trips</span>
            </div>

            {/* Step 5: Protocol Safe */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-semibold text-white">Protocol Safe</span>
              <span className="text-[10px] text-gray-400 mt-1">Funds locked & protected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
