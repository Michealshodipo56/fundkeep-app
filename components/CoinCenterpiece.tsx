/**
 * CoinCenterpiece — Animated SVG coin/planet
 *
 * Layer structure (bottom to top):
 *  1. redGlow      — blurred radial SVG gradient behind disc; opacity-pulses (breathing)
 *  2. orbitRing0   — outermost elliptical orbit ring; rotates CW 35s
 *  3. orbitRing1   — middle ring; rotates CCW 22s
 *  4. orbitRing2   — innermost ring; rotates CW 14s
 *  5. coinDisc     — metallic disc with radial gradient + rim highlight
 *  6. coinEmblem   — Stellar-style swirl mark on the disc face
 *
 * All animations freeze when `prefers-reduced-motion: reduce` is active.
 */

"use client";

import { useReducedMotion, motion } from "framer-motion";

export default function CoinCenterpiece() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative flex items-center justify-center py-8 sm:py-12 overflow-hidden"
      aria-label="Decorative coin animation"
      aria-hidden="true"
    >
      {/* Floor glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[120px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(224,52,42,0.18) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      <svg
        viewBox="0 0 560 320"
        width="560"
        height="320"
        className="max-w-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Coin metallic gradient */}
          <radialGradient id="coinGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#2e2e2e" />
            <stop offset="60%" stopColor="#161616" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>

          {/* Coin rim highlight */}
          <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </radialGradient>

          {/* Red glow gradient */}
          <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0342a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e0342a" stopOpacity="0" />
          </radialGradient>

          {/* Orbit ring stroke gradient */}
          <linearGradient id="ringGrad0" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0342a" stopOpacity="0" />
            <stop offset="30%" stopColor="#e0342a" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#e0342a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#e0342a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0342a" stopOpacity="0" />
            <stop offset="50%" stopColor="#e0342a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e0342a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e0342a" stopOpacity="0" />
            <stop offset="50%" stopColor="#e0342a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#e0342a" stopOpacity="0" />
          </linearGradient>

          {/* Blur filters */}
          <filter id="blurMed">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="blurSm">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* Clip path for Stellar logo bars */}
          <clipPath id="stellarClip">
            <circle cx="280" cy="160" r="30" />
          </clipPath>
        </defs>

        {/* 1. Red glow — breathing */}
        <motion.ellipse
          animate={reduce ? { opacity: 0.7 } : { opacity: [0.55, 0.85, 0.55] }}
          transition={reduce ? undefined : { duration: 3.5, repeat: Infinity, repeatType: "loop" }}
          cx="280" cy="195" rx="90" ry="60"
          fill="url(#redGlow)"
          filter="url(#blurMed)"
        />

        {/* 2. Outermost orbit ring */}
        <motion.ellipse
          animate={reduce ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={reduce ? undefined : { duration: 35, repeat: Infinity }}
          style={{ transformOrigin: "280px 220px" }}
          cx="280" cy="220" rx="230" ry="55"
          fill="none"
          stroke="url(#ringGrad0)"
          strokeWidth="1"
          strokeDasharray="8 6"
          opacity="0.65"
        />

        {/* 3. Middle orbit ring */}
        <motion.ellipse
          animate={reduce ? { rotate: 0 } : { rotate: [0, -360] }}
          transition={reduce ? undefined : { duration: 22, repeat: Infinity }}
          style={{ transformOrigin: "280px 218px" }}
          cx="280" cy="218" rx="168" ry="40"
          fill="none"
          stroke="url(#ringGrad1)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* 4. Inner orbit ring */}
        <motion.ellipse
          animate={reduce ? { rotate: 0 } : { rotate: [0, 360] }}
          transition={reduce ? undefined : { duration: 14, repeat: Infinity }}
          style={{ transformOrigin: "280px 215px" }}
          cx="280" cy="215" rx="110" ry="26"
          fill="none"
          stroke="url(#ringGrad2)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.4"
        />

        {/* 5 & 6. Coin + emblem — floating */}
        <motion.g
          animate={reduce ? { y: 0 } : { y: [0, -18, 0] }}
          transition={reduce ? undefined : { duration: 4, repeat: Infinity, repeatType: "loop" }}
          style={{ transformOrigin: "280px 160px" }}
        >
          {/* Coin disc base */}
          <circle cx="280" cy="160" r="78" fill="url(#coinGrad)" />
          {/* Outer ring highlight */}
          <circle cx="280" cy="160" r="78" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          {/* Inner rim */}
          <circle cx="280" cy="160" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Metallic sheen */}
          <ellipse cx="258" cy="138" rx="22" ry="12" fill="rgba(255,255,255,0.04)" style={{ transform: "rotate(-30deg)", transformOrigin: "258px 138px" }} />
          {/* Red center glow */}
          <circle cx="280" cy="160" r="40" fill="url(#redGlow)" filter="url(#blurSm)" opacity="0.55" />

          {/* 6. Stellar logo — circle ring + two diagonal bars */}
          <g>
            {/* Outer ring */}
            <circle
              cx="280" cy="160" r="30"
              fill="none"
              stroke="rgba(255,255,255,0.88)"
              strokeWidth="4.5"
            />
            {/* Two diagonal bars, clipped strictly inside the circle */}
            <g clipPath="url(#stellarClip)" transform="rotate(-22, 280, 160)">
              {/* Upper bar */}
              <rect x="243" y="143" width="74" height="9" rx="1" fill="rgba(255,255,255,0.88)" />
              {/* Lower bar */}
              <rect x="243" y="168" width="74" height="9" rx="1" fill="rgba(255,255,255,0.88)" />
            </g>
          </g>
        </motion.g>
      </svg>

      {/* Tagline */}
      <p
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-white/30 tracking-widest whitespace-nowrap font-medium"
        aria-hidden="true"
      >
        Simple. Transparent. On-chain.
      </p>
    </section>
  );
}
