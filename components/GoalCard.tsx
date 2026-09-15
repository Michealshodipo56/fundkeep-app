"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function ProgressBar({ value }: { value: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="h-2 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: inView ? `${value}%` : 0 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="h-full rounded-full"
        style={{ background: "linear-gradient(90deg, #e0342a, #ff6b5b)" }}
      />
    </div>
  );
}

/** Marketing preview of the in-app goal card — not a real user record. */
export default function GoalCard() {
  return (
    <div style={{ perspective: "1000px" }} className="w-full max-w-[420px]">
      <motion.div
        initial={{ opacity: 0, y: 30, rotateY: -8, rotateX: 2 }}
        animate={{ opacity: 1, y: 0, rotateY: -8, rotateX: 2 }}
        whileHover={{ rotateY: -2, rotateX: 0, scale: 1.015 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.4, ease: "easeOut" },
          y: { duration: 0.6, delay: 0.4, ease: "easeOut" },
          rotateY: { duration: 0.2, ease: "easeOut" },
          rotateX: { duration: 0.2, ease: "easeOut" },
          scale: { duration: 0.2, ease: "easeOut" },
        }}
        className="relative rounded-2xl bg-[#111] card-border overflow-hidden w-full"
        style={{
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), -8px 12px 32px rgba(0,0,0,0.5)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <span className="text-sm font-semibold text-white/80">Locked savings</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest bg-white/5 text-white/50 border border-white/10">
            Preview
          </span>
        </div>

        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Your USDC goal</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest bg-red/15 text-red border border-red/30">
              LOCKED
            </span>
          </div>

          <div className="flex items-end justify-between mb-1.5">
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">0.00</span>
              <span className="ml-1.5 text-sm font-medium text-white/50">USDC</span>
              <p className="text-xs text-white/30 mt-0.5">of your target</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">0%</div>
              <div className="text-xs text-white/40">Progress</div>
            </div>
          </div>

          <ProgressBar value={8} />

          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs text-white/40">Plan</p>
              <p className="text-sm font-semibold text-white mt-0.5">Weekly</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Unlock</p>
              <p className="text-sm font-semibold text-white mt-0.5">Target or deadline</p>
            </div>
          </div>

          <p className="text-[11px] text-white/35 mt-4 leading-relaxed">
            Connect Freighter to create a real goal. Amounts on this card are a layout preview, not an account.
          </p>
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(224,52,42,0.05) 0%, transparent 60%)",
          }}
        />
      </motion.div>
    </div>
  );
}
