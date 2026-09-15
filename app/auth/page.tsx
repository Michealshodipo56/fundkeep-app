"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkFreighterInstalled } from "@/lib/freighter";
import { useWallet } from "@/lib/wallet-context";
import { configuredNetwork } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const { walletAddress, connect, isConnecting, hydrated } = useWallet();
  const network = configuredNetwork();

  const [freighterInstalled, setFreighterInstalled] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    // Detect Freighter extension on load
    checkFreighterInstalled().then((installed) => {
      setFreighterInstalled(installed);
    });
  }, []);

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (hydrated && walletAddress) {
      router.push("/dashboard");
    }
  }, [hydrated, walletAddress, router]);

  const handleConnectFreighter = async () => {
    setFeedback(null);

    if (freighterInstalled === false) {
      setFeedback({
        type: "error",
        text: "Freighter is not installed. Install it from freighter.app, set it to Testnet, then connect again.",
      });
      return;
    }

    const result = await connect();

    if (result.success) {
      setFeedback({
        type: "success",
        text: `Connected to Stellar ${network}. Redirecting…`,
      });
      setTimeout(() => router.push("/dashboard"), 800);
      return;
    }

    setFeedback({
      type: "error",
      text: result.error || "Could not connect to Freighter.",
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between relative overflow-hidden selection:bg-red selection:text-white">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(224,52,42,0.4) 0%, rgba(224,52,42,0.05) 50%, transparent 80%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2" aria-label="FundKeep home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="FundKeep logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">
            Fund<span className="text-red">Keep</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl bg-[#111]/90 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Top border red accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red to-transparent" />

          {/* Network Selector Pill */}
          <div className="flex items-center justify-between mb-6 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white/90">Stellar Network</span>
            </div>
            <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-red text-white">
                {network === "PUBLIC" ? "MAINNET" : "TESTNET"}
              </span>
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Connect Wallet
            </h1>
            <p className="text-xs text-white/50 mt-1.5">
              Authenticate directly on Stellar using Freighter to manage your locked savings goals
            </p>
          </div>

          {/* Connect State (walletAddress is null when on this page) */}
          <div className="flex flex-col gap-4">
            {/* Main Connect Button */}
            <button
              type="button"
              id="connect-freighter-btn"
              onClick={handleConnectFreighter}
              disabled={isConnecting}
              className="w-full py-4 px-5 rounded-xl bg-red text-white text-sm font-bold transition-all hover:opacity-95 hover:shadow-[0_0_32px_rgba(224,52,42,0.6)] glow-red flex items-center justify-center gap-3 group relative overflow-hidden min-h-[54px]"
            >
              {isConnecting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Connecting Freighter…</span>
                </>
              ) : (
                <>
                  {/* Official Freighter Rocket Mark */}
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="shrink-0">
                    <path
                      d="M16 4 C20 4 24 8 24 14 L24 20 L16 28 L8 20 L8 14 C8 8 12 4 16 4Z"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path d="M13 20 L16 28 L19 20" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="16" cy="14" r="3.5" fill="white" />
                  </svg>
                  <span>Connect Freighter Wallet</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="ml-auto opacity-70 group-hover:translate-x-1 transition-transform"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>

            {/* Status helper text */}
            <div className="flex items-center justify-between px-1 text-[11px] text-white/40">
              <span>
                {freighterInstalled === true
                  ? "✓ Freighter extension ready"
                  : freighterInstalled === false
                  ? "Freighter extension not installed"
                  : "Detecting extension…"}
              </span>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red hover:underline flex items-center gap-1"
              >
                Get Freighter ↗
              </a>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-xs py-2.5 px-3.5 rounded-xl text-center font-medium border ${
                feedback.type === "success"
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : feedback.type === "error"
                  ? "text-red bg-red/10 border-red/20"
                  : "text-sky-400 bg-sky-500/10 border-sky-500/20"
              }`}
            >
              {feedback.text}
            </motion.div>
          )}

          {/* Security details */}
          <div className="mt-8 pt-5 border-t border-white/5 flex flex-col gap-2.5 text-xs text-white/40">
            <div className="flex items-center justify-between">
              <span>Smart Contracts</span>
              <span className="font-semibold text-white/70">Soroban Rust v21</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Custody</span>
              <span className="font-semibold text-white/70">Non-Custodial (Your Keys)</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-white/30 relative z-10">
        © {new Date().getFullYear()} FundKeep. 100% On-Chain Stellar Architecture.
      </footer>
    </main>
  );
}
