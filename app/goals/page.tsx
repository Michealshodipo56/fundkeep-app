"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { CADENCE_LABELS, formatDeadline, formatUsdc, suggestedSaveAmount } from "@/lib/utils";

export default function GoalsPage() {
  const { goals } = useWallet();
  const [activeFilter, setActiveFilter] = useState<"all" | "locked" | "unlocked">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGoals = goals.filter((goal) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "locked" && goal.status === "LOCKED") ||
      (activeFilter === "unlocked" && goal.status === "UNLOCKED");
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell current="goals">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Goals</h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
              Manage and track your locked savings goals on Stellar.
            </p>
          </div>
          <Link
            href="/goals/create"
            className="px-4 py-2.5 rounded-xl bg-red text-white text-xs sm:text-sm font-semibold glow-red"
          >
            + Create New Goal
          </Link>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            {(["all", "locked", "unlocked"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  activeFilter === filter ? "bg-red text-white" : "bg-white/5 text-white/50"
                }`}
              >
                {filter === "all" ? "All Goals" : filter}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="flex-1 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGoals.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3 p-10 rounded-2xl bg-[#141414] border border-white/10 text-center">
              <p className="text-sm font-semibold text-white/70">No goals to show</p>
              <p className="text-xs text-white/40 mt-1">Create a goal or change the filter.</p>
            </div>
          )}

          {filteredGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100) || 0);
            const planAmount = suggestedSaveAmount(goal.target, goal.deadline, goal.cadence, goal.saved);
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{goal.title}</h3>
                    {goal.description && <p className="text-xs text-white/40 mt-1">{goal.description}</p>}
                    <p className="text-xs text-white/40 mt-1">Deadline: {formatDeadline(goal.deadline)}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      goal.status === "LOCKED"
                        ? "bg-red/20 text-red"
                        : goal.status === "UNLOCKED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {goal.status}
                  </span>
                </div>
                <p className="text-xs text-white/40">{CADENCE_LABELS[goal.cadence]} plan</p>
                {goal.status === "LOCKED" && planAmount !== null && (
                  <p className="text-[11px] text-red/90 font-semibold">
                    {formatUsdc(planAmount)} USDC
                    {goal.cadence === "daily"
                      ? " / day"
                      : goal.cadence === "weekly"
                      ? " / week"
                      : goal.cadence === "monthly"
                      ? " / month"
                      : " remaining"}
                  </p>
                )}
                <div>
                  <p className="text-sm font-bold text-white">
                    {formatUsdc(goal.saved)} / {formatUsdc(goal.target)} USDC
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-red rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/goals/${goal.id}`} className="flex-1 py-2 px-3 rounded-xl bg-red/10 border border-red/30 text-red text-xs font-bold text-center">
                    {goal.status === "LOCKED" ? "View & Fund Goal" : "View Goal"}
                  </Link>
                </div>
              </motion.div>
            );
          })}

          <Link
            href="/goals/create"
            className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-red/40 hover:bg-red/5 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-red/20 text-red flex items-center justify-center text-xl font-bold">
              +
            </div>
            <p className="text-sm font-bold text-white">Create New Savings Goal</p>
            <p className="text-xs text-white/40">Lock funds on Stellar until your goal is reached.</p>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
