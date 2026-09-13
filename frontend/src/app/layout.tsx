import type { Metadata } from "next";
import "./globals.css";
import { ProtocolProvider } from "../lib/context/ProtocolContext";
import { CircuitBackground } from "../components/ui/CircuitBackground";

export const metadata: Metadata = {
  title: "HaltLayer | Autonomous Emergency Circuit-Breaker for Intelligent Contracts",
  description:
    "Autonomous protection for the agentic economy. HaltLayer turns real-world evidence and decentralized judgment into autonomous protocol protection via GenLayer Intelligent Contracts.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090E] text-gray-100 min-h-screen relative font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <ProtocolProvider>
          <CircuitBackground />
          <div className="relative z-10">{children}</div>
        </ProtocolProvider>
      </body>
    </html>
  );
}
