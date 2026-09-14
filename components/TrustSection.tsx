"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const trustPoints = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5 4.5-1.35 8-6.25 8-11.5V6L12 2z"
          stroke="#e0342a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 12l2 2 4-4" stroke="#e0342a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "On-chain enforcement",
    desc: "Rules are enforced by Soroban smart contracts.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="#e0342a" strokeWidth="1.5" />
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#e0342a" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "No middleman",
    desc: "We never custody your funds.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" stroke="#e0342a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="8 6 2 12 8 18" stroke="#e0342a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Open source",
    desc: "Transparent, auditable, community driven.",
  },
];

const statusBadges = [
  { label: "MIT Licensed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  { label: "Open Source", color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  { label: "Built on Soroban", color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  { label: "Testnet Live", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
];

export default function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="security"
      ref={ref}
      className="py-24 relative overflow-hidden"
      aria-labelledby="trust-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 50%, rgba(224,52,42,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55 }}
          >
            <p className="text-xs font-semibold tracking-widest text-red uppercase mb-4">
              Built for Trust
            </p>
            <h2 id="trust-heading" className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              Your funds. Your goals.
              <br />
              Our code keeps the{" "}
              <span className="text-red">promise.</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-10 max-w-md">
              FundKeep is built on Stellar Soroban smart contracts, ensuring your funds are never
              held by us — only by transparent, verifiable code.
            </p>

            {/* Trust points */}
            <div className="flex flex-col gap-6">
              {trustPoints.map((tp, i) => (
                <motion.div
                  key={tp.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#161616] border border-white/8 flex items-center justify-center shrink-0">
                    {tp.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-0.5">{tp.title}</h3>
                    <p className="text-xs text-white/40">{tp.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — status badges card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="rounded-2xl bg-[#111] card-border p-8"
            style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
          >
            <h3 className="text-lg font-bold text-white mb-6">FundKeep Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {statusBadges.map((b) => (
                <div
                  key={b.label}
                  className={`flex items-center gap-2 px-4 py-4 rounded-xl border text-sm font-semibold ${b.color}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-80 shrink-0" />
                  {b.label}
                </div>
              ))}
            </div>

            {/* GitHub link */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-white/40 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7C6.73 19.91 6.14 18 6.14 18c-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.115 2.51.338 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              <span>
                Source code available on{" "}
                <a
                  href="https://github.com/Michealshodipo56/fundkeep-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                >
                  GitHub
                </a>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
