"use client";

import React, { useState, useEffect } from "react";
import { HaltLogo } from "../brand/HaltLogo";
import { ArrowRight, ShieldCheck, Cpu, SkipForward } from "lucide-react";

interface CinematicIntroProps {
  onComplete: () => void;
  onExploreHowItWorks: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  onExploreHowItWorks,
}) => {
  // Stages:
  // 0: A - Almost-black screen
  // 1: B - Tiny central point of light appears
  // 2: C - Point expands into HaltLayer logo
  // 3: D - Circuit traces grow outward
  // 4: E - Validator nodes appear
  // 5: F - Nodes establish connections
  // 6: G - Threat signal enters
  // 7: H - Investigation state (amber)
  // 8: I - Nodes converge toward decision
  // 9: J - Circuit breaker locks into place
  // 10: K, L - Wordmark & "Autonomous protection for the agentic economy."
  // 11: M - Reveal CTAs: Launch Console / How It Works
  const [stage, setStage] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
      setStage(11); // Jump straight to revealed state
      return;
    }

    const stageDelays = [
      400,  // 0 -> 1: light appears
      600,  // 1 -> 2: logo expands
      700,  // 2 -> 3: circuit traces grow
      600,  // 3 -> 4: validator nodes appear
      600,  // 4 -> 5: connections established
      700,  // 5 -> 6: threat signal enters
      700,  // 6 -> 7: investigation state
      600,  // 7 -> 8: nodes converge
      600,  // 8 -> 9: breaker locks
      700,  // 9 -> 10: wordmark resolves
      400,  // 10 -> 11: CTAs reveal
    ];

    let current = 0;
    let timer: NodeJS.Timeout;

    const runNext = () => {
      if (current < stageDelays.length) {
        timer = setTimeout(() => {
          current += 1;
          setStage(current);
          runNext();
        }, stageDelays[current]);
      }
    };

    runNext();

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setStage(11);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070B] flex flex-col items-center justify-center overflow-hidden px-4 select-none">
      {/* Skip button in top corner */}
      {stage < 11 && !prefersReducedMotion && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Central Interactive Animation Canvas */}
      <div className="relative w-full max-w-2xl h-80 sm:h-96 flex items-center justify-center">
        {/* Stage 1: Point of light */}
        <div
          className={`absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_24px_8px_rgba(0,216,255,0.8)] transition-all duration-700 ${
            stage >= 1 && stage < 3 ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        />

        {/* Outer Validator Network Rings & Traces */}
        <svg
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${
            stage >= 3 ? "opacity-100" : "opacity-0"
          }`}
          viewBox="0 0 600 400"
        >
          {/* Subtle Concentric Security Grid */}
          <circle
            cx="300"
            cy="200"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="300"
            cy="200"
            r="170"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />

          {/* Circuit Traces Outward from Logo (Stage >= 3) */}
          <g
            className={`transition-all duration-700 ${
              stage >= 3 ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Top-Left */}
            <path
              d="M260 160 L200 120 H150"
              fill="none"
              stroke={stage >= 7 ? "rgba(255,176,32,0.6)" : "rgba(0,216,255,0.4)"}
              strokeWidth="1.5"
              strokeDasharray={stage >= 6 ? "4 4" : "none"}
            />
            {/* Top-Right */}
            <path
              d="M340 160 L400 120 H450"
              fill="none"
              stroke={stage >= 7 ? "rgba(255,176,32,0.6)" : "rgba(0,240,168,0.4)"}
              strokeWidth="1.5"
            />
            {/* Bottom-Left */}
            <path
              d="M260 240 L200 280 H150"
              fill="none"
              stroke="rgba(0,216,255,0.4)"
              strokeWidth="1.5"
            />
            {/* Bottom-Right */}
            <path
              d="M340 240 L400 280 H450"
              fill="none"
              stroke="rgba(0,240,168,0.4)"
              strokeWidth="1.5"
            />
          </g>

          {/* Validator Nodes (Stage >= 4) */}
          <g
            className={`transition-all duration-700 ${
              stage >= 4 ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            {/* Node 1: Top */}
            <circle cx="300" cy="80" r="5" fill="#00D8FF" />
            <text x="300" y="65" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">VALIDATOR 1</text>

            {/* Node 2: Right */}
            <circle cx="470" cy="200" r="5" fill="#00F0A8" />
            <text x="470" y="225" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">VALIDATOR 2</text>

            {/* Node 3: Bottom */}
            <circle cx="300" cy="320" r="5" fill="#00F0A8" />
            <text x="300" y="340" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">VALIDATOR 3</text>

            {/* Node 4: Left */}
            <circle cx="130" cy="200" r="5" fill="#00D8FF" />
            <text x="130" y="225" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">VALIDATOR 4</text>
          </g>

          {/* Node Consensus Interconnections (Stage >= 5) */}
          <g
            className={`transition-opacity duration-700 ${
              stage >= 5 ? "opacity-100" : "opacity-0"
            }`}
          >
            <line x1="300" y1="80" x2="470" y2="200" stroke="rgba(0,216,255,0.2)" strokeWidth="1" />
            <line x1="470" y1="200" x2="300" y2="320" stroke="rgba(0,240,168,0.2)" strokeWidth="1" />
            <line x1="300" y1="320" x2="130" y2="200" stroke="rgba(0,240,168,0.2)" strokeWidth="1" />
            <line x1="130" y1="200" x2="300" y2="80" stroke="rgba(0,216,255,0.2)" strokeWidth="1" />
          </g>

          {/* Threat / Exploit Signal Enters (Stage 6) */}
          {stage >= 6 && stage <= 8 && (
            <g className="animate-pulse">
              <circle cx="130" cy="120" r="6" fill="#FF3355" className="animate-ping" />
              <circle cx="130" cy="120" r="4" fill="#FF3355" />
              <line
                x1="130"
                y1="120"
                x2="260"
                y2="180"
                stroke="#FF3355"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <text x="130" y="105" textAnchor="middle" fill="#FF7A8F" fontSize="9" fontFamily="monospace">
                ANOMALY TELEMETRY
              </text>
            </g>
          )}

          {/* Convergence Beams (Stage >= 8) */}
          {stage >= 8 && (
            <g>
              <line x1="300" y1="80" x2="300" y2="160" stroke="#00F0A8" strokeWidth="2" opacity="0.6" />
              <line x1="470" y1="200" x2="340" y2="200" stroke="#00F0A8" strokeWidth="2" opacity="0.6" />
              <line x1="300" y1="320" x2="300" y2="240" stroke="#00F0A8" strokeWidth="2" opacity="0.6" />
              <line x1="130" y1="200" x2="260" y2="200" stroke="#00F0A8" strokeWidth="2" opacity="0.6" />
            </g>
          )}
        </svg>

        {/* Central Logo (Expands at Stage 2, Locks at Stage 9) */}
        <div
          className={`relative z-10 transition-all duration-700 transform ${
            stage < 2
              ? "scale-0 opacity-0"
              : stage >= 9
              ? "scale-110 opacity-100"
              : "scale-100 opacity-100"
          }`}
        >
          <HaltLogo
            size={110}
            variant={stage >= 7 && stage <= 8 ? "investigating" : "active"}
            animated={stage < 9}
          />
        </div>
      </div>

      {/* Typography & Messages (Stage >= 10) */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto mt-4 min-h-[140px]">
        <div
          className={`transition-all duration-700 transform ${
            stage >= 10
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-white mb-2">
            <span>HALT</span>
            <span className="text-cyan-400">LAYER</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 font-sans tracking-wide">
            Autonomous protection for the agentic economy.
          </p>
        </div>

        {/* Stage 11: Reveal Action CTAs */}
        <div
          className={`flex items-center gap-4 mt-6 transition-all duration-500 transform ${
            stage >= 11
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-semibold text-sm transition-all shadow-[0_0_24px_-4px_rgba(0,240,168,0.4)] hover:shadow-[0_0_32px_-2px_rgba(0,240,168,0.6)] cursor-pointer"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreHowItWorks}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            <span>How It Works</span>
          </button>
        </div>
      </div>
    </div>
  );
};
