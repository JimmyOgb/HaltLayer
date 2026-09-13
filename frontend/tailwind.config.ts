import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090E",
        surface: {
          50: "#0D111A",
          100: "#121724",
          200: "#182032",
          300: "#202B42",
          border: "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.16)",
        },
        shield: {
          active: "#00F0A8",
          investigating: "#FFB020",
          halted: "#FF3355",
          accent: "#00D8FF",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(0, 240, 168, 0.25)",
        "glow-halt": "0 0 32px -4px rgba(255, 51, 85, 0.35)",
        "glow-warn": "0 0 28px -4px rgba(255, 176, 32, 0.3)",
        "glow-accent": "0 0 28px -4px rgba(0, 216, 255, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beacon": "beacon 2s ease-in-out infinite",
      },
      keyframes: {
        beacon: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(1.2)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
