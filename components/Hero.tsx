"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import GoalCard from "./GoalCard";

const trustBadges = [
  {
    label: "Built on Stellar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12h8M12 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Secured by Soroban",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5 4.5-1.35 8-6.25 8-11.5V6L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "USDC Only",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#2775CA" strokeWidth="1.5" />
        <text x="7.5" y="16" fontSize="8" fontWeight="700" fill="#2775CA">$</text>
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background grid shimmer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 60% 10%, rgba(224,52,42,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* Left column — tighter vertical rhythm to match reference */}
          <div className="flex flex-col gap-4">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/60 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                Built on Stellar
                <span className="text-white/20">+</span>
                Powered by Soroban
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight">
                <span className="block sm:whitespace-nowrap">Lock your savings.</span>
                <span className="block sm:whitespace-nowrap text-red">Reach your goals.</span>
              </h1>
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg mb-1"
            >
              FundKeep helps you lock USDC toward a savings goal on Stellar. Your funds stay
              secure and are only withdrawable when your target is reached or the deadline passes
              — enforced on-chain, not by trust.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red text-white font-semibold text-sm transition-all duration-150 hover:opacity-90 hover:shadow-[0_0_30px_rgba(224,52,42,0.55)] glow-red min-h-[44px]"
              >
                Create Your Goal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/25 transition-all duration-150 min-h-[44px]"
              >
                View Demo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
                </svg>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-wrap items-center gap-3"
            >
              {trustBadges.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/3 text-xs text-white/45"
                >
                  {b.icon}
                  {b.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column — dashboard card */}
          <div className="flex justify-center lg:justify-center">
            <GoalCard />
          </div>
        </div>
      </div>
    </section>
  );
}
