"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/navigation/Header";
import { HeroSection } from "../components/hero/HeroSection";
import { SecurityConsole } from "../components/console/SecurityConsole";
import { HowItWorksSection } from "../components/how-it-works/HowItWorksSection";
import { CinematicIntro } from "../components/cinematic/CinematicIntro";
import { useProtocol } from "../lib/context/ProtocolContext";
import { HaltLogo } from "../components/brand/HaltLogo";
import { ExternalLink, ShieldCheck, Github, BookOpen } from "lucide-react";

export default function Home() {
  const [showCinematic, setShowCinematic] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<"console" | "incidents" | "how-it-works">("console");
  const { haltLayerAddress, demoVaultAddress, networkName } = useProtocol();

  // Check if intro has already been shown in this session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("hl_intro_seen");
      if (seen) {
        setShowCinematic(false);
      }
    }
  }, []);

  const handleFinishIntro = () => {
    setShowCinematic(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hl_intro_seen", "true");
    }
  };

  const handleExploreHowItWorks = () => {
    handleFinishIntro();
    setCurrentTab("how-it-works");
    setTimeout(() => {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelectTab = (tab: "console" | "incidents" | "how-it-works") => {
    setCurrentTab(tab);
    if (tab === "incidents") {
      const el = document.getElementById("incidents-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "how-it-works") {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Cinematic Introduction */}
      {showCinematic && (
        <CinematicIntro
          onComplete={handleFinishIntro}
          onExploreHowItWorks={handleExploreHowItWorks}
        />
      )}

      <div>
        {/* Top Navigation */}
        <Header currentTab={currentTab} onSelectTab={handleSelectTab} />

        {/* Hero Section */}
        <HeroSection
          onLaunchConsole={() => handleSelectTab("console")}
          onHowItWorks={() => handleSelectTab("how-it-works")}
        />

        {/* Main Application Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SecurityConsole />
        </div>

        {/* Explanatory How It Works Section */}
        <HowItWorksSection />
      </div>

      {/* Modern Technical Footer */}
      <footer className="border-t border-white/[0.08] bg-[#05070B] py-12 text-xs font-mono text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <HaltLogo size={28} variant="active" />
            <div>
              <div className="text-white font-bold tracking-wider">HALTLAYER PROTOCOL</div>
              <div className="text-[10px] text-gray-400">
                Autonomous Emergency Circuit-Breaker on GenLayer
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <span className="text-gray-400">
              Active Network: <span className="text-cyan-400 capitalize">{networkName}</span>
            </span>
            <span className="text-gray-400">
              Target Vault:{" "}
              <span className="text-gray-300">
                {demoVaultAddress ? `${demoVaultAddress.slice(0, 6)}...${demoVaultAddress.slice(-4)}` : "Configured"}
              </span>
            </span>
            <button
              onClick={() => setShowCinematic(true)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Replay Intro
            </button>
          </div>

          <div className="text-[11px] text-gray-400 text-center md:text-right">
            GenLayer Agent Tank Hackathon Submission (2026)
          </div>
        </div>
      </footer>
    </main>
  );
}
