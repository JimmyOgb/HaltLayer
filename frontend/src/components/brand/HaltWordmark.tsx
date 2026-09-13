import React from "react";
import { HaltLogo } from "./HaltLogo";

interface HaltWordmarkProps {
  size?: "sm" | "md" | "lg" | "hero";
  subtitle?: boolean;
  className?: string;
  variant?: "default" | "monochrome" | "halted" | "investigating" | "active";
}

export const HaltWordmark: React.FC<HaltWordmarkProps> = ({
  size = "md",
  subtitle = false,
  className = "",
  variant = "default",
}) => {
  const logoSizes = {
    sm: 24,
    md: 34,
    lg: 44,
    hero: 64,
  };

  const titleSizes = {
    sm: "text-base font-semibold tracking-wider",
    md: "text-xl font-bold tracking-wider",
    lg: "text-2xl font-black tracking-widest",
    hero: "text-4xl md:text-5xl font-black tracking-widest",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <HaltLogo size={logoSizes[size]} variant={variant} />
      <div className="flex flex-col">
        <span className={`font-mono text-white flex items-center gap-1.5 ${titleSizes[size]}`}>
          <span>HALT</span>
          <span className="text-cyan-400">LAYER</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
            Autonomous Circuit-Breaker
          </span>
        )}
      </div>
    </div>
  );
};
