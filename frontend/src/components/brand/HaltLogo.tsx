import React from "react";

interface HaltLogoProps {
  size?: number | string;
  className?: string;
  variant?: "default" | "monochrome" | "halted" | "investigating" | "active";
  animated?: boolean;
}

export const HaltLogo: React.FC<HaltLogoProps> = ({
  size = 40,
  className = "",
  variant = "default",
  animated = false,
}) => {
  // Variant palette
  let primaryColor = "#00F0A8"; // Active emerald
  let secondaryColor = "#00D8FF"; // Cyan pulse
  let glowColor = "rgba(0, 240, 168, 0.4)";

  if (variant === "halted") {
    primaryColor = "#FF3355"; // Emergency crimson
    secondaryColor = "#FF7A8F";
    glowColor = "rgba(255, 51, 85, 0.5)";
  } else if (variant === "investigating") {
    primaryColor = "#FFB020"; // Amber warning
    secondaryColor = "#FFD166";
    glowColor = "rgba(255, 176, 32, 0.4)";
  } else if (variant === "monochrome") {
    primaryColor = "#FFFFFF";
    secondaryColor = "#9CA3AF";
    glowColor = "rgba(255, 255, 255, 0.2)";
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none transition-all duration-300 ${className}`}
      aria-label="HaltLayer Shield Circuit-Breaker Mark"
      role="img"
    >
      <defs>
        {/* Outer Shield Gradient */}
        <linearGradient id={`hlShieldGrad-${variant}`} x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#121826" />
          <stop offset="100%" stopColor="#080C14" />
        </linearGradient>

        {/* Dynamic Circuit Stroke Gradient */}
        <linearGradient id={`hlCircuitGrad-${variant}`} x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>

        {/* Glow Filter */}
        <filter id={`hlGlow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hex-Shield Perimeter with subtle stroke */}
      <path
        d="M60 8 L104 28 V68 C104 92 60 112 60 112 C60 112 16 92 16 68 V28 L60 8 Z"
        fill={`url(#hlShieldGrad-${variant})`}
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="2"
      />

      {/* Inner Defensive Shield Inset */}
      <path
        d="M60 16 L96 33 V65 C96 85 60 102 60 102 C60 102 24 85 24 65 V33 L60 16 Z"
        stroke={`url(#hlCircuitGrad-${variant})`}
        strokeWidth="1.8"
        strokeDasharray={animated ? "4 2" : "none"}
        className={animated ? "animate-pulse" : ""}
        strokeOpacity="0.75"
      />

      {/* Abstract 'H' Geometric Circuit Breaker Motif */}
      {/* Left Pillar */}
      <path
        d="M40 38 V82"
        stroke={`url(#hlCircuitGrad-${variant})`}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#hlGlow-${variant})`}
      />

      {/* Right Pillar */}
      <path
        d="M80 38 V82"
        stroke={`url(#hlCircuitGrad-${variant})`}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#hlGlow-${variant})`}
      />

      {/* Interruption / Circuit Breaker Bridge (Central Crossbar) */}
      {variant === "halted" ? (
        // Open/Tripped breaker state: severed bridge with diagnostic gap
        <g>
          <path
            d="M40 60 H52"
            stroke={primaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            filter={`url(#hlGlow-${variant})`}
          />
          <path
            d="M68 60 H80"
            stroke={primaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            filter={`url(#hlGlow-${variant})`}
          />
          {/* Emergency Breaker Node Warning */}
          <circle cx="60" cy="60" r="4.5" fill={primaryColor} className="animate-ping" />
          <circle cx="60" cy="60" r="3.5" fill="#FFFFFF" />
        </g>
      ) : (
        // Closed/Continuous circuit breaker bridge with high-tech central core
        <g>
          <path
            d="M40 60 H80"
            stroke={`url(#hlCircuitGrad-${variant})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            filter={`url(#hlGlow-${variant})`}
          />
          {/* Central Autonomous Consensus Core Node */}
          <circle cx="60" cy="60" r="4.5" fill="#0A0E17" stroke={secondaryColor} strokeWidth="2.5" />
          <circle cx="60" cy="60" r="2" fill={primaryColor} />
        </g>
      )}

      {/* Peripheral Circuit Nodes & Traces */}
      <circle cx="40" cy="38" r="3" fill={secondaryColor} />
      <circle cx="40" cy="82" r="3" fill={primaryColor} />
      <circle cx="80" cy="38" r="3" fill={secondaryColor} />
      <circle cx="80" cy="82" r="3" fill={primaryColor} />

      {/* Top and Bottom Anchor Traces */}
      <line x1="60" y1="20" x2="60" y2="30" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="60" y1="90" x2="60" y2="100" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
};
