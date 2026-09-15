"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWallet, type ActivityEntry } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { CadencePicker, SavePlanHint } from "@/components/CadencePicker";
import {
  CADENCE_LABELS,
  formatDeadline,
  formatUsdc,
  getGreeting,
  shortAddress,
  suggestedSaveAmount,
  timeAgo,
  type SaveCadence,
} from "@/lib/utils";

function ActivityIcon({ type }: { type: ActivityEntry["type"] }) {
  if (type === "deposit") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "withdraw") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "unlock") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function activityLabel(type: ActivityEntry["type"]): string {
  const map: Record<ActivityEntry["type"], string> = {
    deposit: "Deposit",
    withdraw: "Withdrawal",
    unlock: "Goal Unlocked",
    create: "Goal Created",
  };
  return map[type];
}

const DONUT_R = 70;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

function DonutChart({ percent }: { percent: number }) {
  const offset = DONUT_CIRCUMFERENCE * (1 - percent / 100);
  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
        <circle cx="88" cy="88" r={DONUT_R} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="88"
          cy="88"
          r={DONUT_R}
          stroke="#e0342a"
          strokeWidth="14"
          fill="none"
          strokeDasharray={DONUT_CIRCUMFERENCE}
          initial={{ strokeDashoffset: DONUT_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-white tracking-tight">{percent}%</span>
        <span className="text-[11px] text-white/40 font-medium mt-0.5">Overall Progress</span>
      </div>
    </div>
  );
}

function CadenceBadge({ cadence }: { cadence: SaveCadence }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
      {CADENCE_LABELS[cadence]}
    </span>
  );
}

export default function DashboardPage() {
  const { walletAddress, createGoal, checkDeadlines, activity, stats, profile, goals } = useWallet();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalCadence, setNewGoalCadence] = useState<SaveCadence>("weekly");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    void checkDeadlines();
  }, [checkDeadlines]);

  const handleCreateGoal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGoalTitle || !newGoalTarget || !newGoalDeadline) return;
      setCreating(true);
      setCreateError(null);

      try {
        await createGoal({
          title: newGoalTitle,
          cadence: newGoalCadence,
          target: parseFloat(newGoalTarget),
          deadline: newGoalDeadline,
        });

        setNewGoalTitle("");
        setNewGoalTarget("");
        setNewGoalDeadline("");
        setNewGoalCadence("weekly");
        setCreateModalOpen(false);
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Failed to create goal.");
      } finally {
        setCreating(false);
      }
    },
    [newGoalTitle, newGoalTarget, newGoalDeadline, newGoalCadence, createGoal]
  );

  const displayName =
    profile.displayName.trim() || (walletAddress ? shortAddress(walletAddress) : "");
  const recentActivity = activity.slice(0, 4);
  const targetNum = parseFloat(newGoalTarget || "0");

  return (
    <AppShell current="dashboard">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {getGreeting()}, {displayName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1 font-medium">
              Keep building toward your goals.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/activity"
              className="relative w-10 h-10 rounded-xl bg-[#161616] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition-all"
              aria-label="Activity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {activity.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red ring-2 ring-[#161616]" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red text-white text-xs sm:text-sm font-semibold transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(224,52,42,0.4)] glow-red"
            >
              <span className="text-base font-bold">+</span>
              Create New Goal
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Stats Overview">
          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="16" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Total Saved</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">
                {formatUsdc(stats.totalSaved)} <span className="text-xs font-normal text-white/40">USDC</span>
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">Across all goals</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Active Goals</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">{stats.activeGoals}</p>
              <p className="text-[11px] text-white/40 mt-0.5">In progress</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Locked Funds</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">
                {formatUsdc(stats.lockedFunds)} <span className="text-xs font-normal text-white/40">USDC</span>
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">Currently locked</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Completed Goals</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">{stats.completedGoals}</p>
              <p className="text-[11px] text-white/40 mt-0.5">Total completed</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">My Goals</h2>
              <Link href="/goals" className="text-xs text-red font-semibold hover:underline">
                View all goals →
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              {goals.length === 0 && (
                <div className="p-8 rounded-2xl bg-[#141414] border border-white/10 text-center">
                  <p className="text-sm text-white/70 font-semibold">No savings goals yet</p>
                  <p className="text-xs text-white/40 mt-1">Create a goal to start locking USDC on Stellar.</p>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-red text-white text-xs font-bold"
                  >
                    Create your first goal
                  </button>
                </div>
              )}

              {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100) || 0);
                const remaining = Math.max(0, goal.target - goal.saved);
                const planAmount = suggestedSaveAmount(goal.target, goal.deadline, goal.cadence, goal.saved);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{goal.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              goal.status === "LOCKED"
                                ? "bg-red/20 text-red border border-red/30"
                                : goal.status === "UNLOCKED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/10 text-white/70 border border-white/15"
                            }`}
                          >
                            {goal.status}
                          </span>
                          <CadenceBadge cadence={goal.cadence} />
                        </div>
                        <p className="text-xs text-white/40 mt-1">Deadline: {formatDeadline(goal.deadline)}</p>
                        {goal.status === "LOCKED" && planAmount !== null && (
                          <p className="text-[11px] text-red/90 font-semibold mt-1">
                            {formatUsdc(planAmount)} USDC{" "}
                            {goal.cadence === "daily"
                              ? "/ day"
                              : goal.cadence === "weekly"
                              ? "/ week"
                              : goal.cadence === "monthly"
                              ? "/ month"
                              : "remaining"}{" "}
                            to reach target
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">
                          {formatUsdc(goal.saved)} <span className="text-xs font-normal text-white/50">USDC</span>
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">of {formatUsdc(goal.target)} USDC</p>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-red/80 to-red rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-xs">
                      <span className="font-semibold text-red">{percent}%</span>
                      <span className="text-white/40">
                        {goal.status === "WITHDRAWN"
                          ? "Withdrawn"
                          : goal.status === "UNLOCKED"
                          ? "Ready to withdraw"
                          : `${formatUsdc(remaining)} USDC remaining`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-red/40 hover:bg-red/5 transition-all text-xs font-bold text-white/60 hover:text-white flex items-center justify-center gap-2 min-h-[54px]"
              >
                + Create New Goal
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col gap-4">
              <h3 className="text-base font-bold text-white tracking-tight">Goal Progress</h3>
              <div className="flex items-center justify-center py-2">
                <DonutChart percent={stats.overallPercent} />
              </div>
              <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Saved</span>
                  <span className="font-bold text-white">{formatUsdc(stats.totalSaved)} USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Total Target</span>
                  <span className="font-bold text-white">{formatUsdc(stats.totalTarget)} USDC</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
                <Link href="/activity" className="text-xs text-red font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {recentActivity.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">No activity yet.</p>
                )}
                {recentActivity.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between py-2 ${
                      idx < recentActivity.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red/10 border border-red/30 text-red">
                        <ActivityIcon type={entry.type} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{activityLabel(entry.type)}</p>
                        <p className="text-[11px] text-white/40">{entry.goalTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.amount !== undefined && (
                        <p className="text-xs font-bold text-red">
                          {entry.type === "withdraw" ? "-" : "+"}
                          {formatUsdc(entry.amount)} USDC
                        </p>
                      )}
                      <p className="text-[10px] text-white/40">{timeAgo(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red to-transparent" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Create New Saving Goal</h2>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Emergency Fund"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Save plan</label>
                  <CadencePicker value={newGoalCadence} onChange={setNewGoalCadence} />
                  <p className="text-[11px] text-white/35 mt-1.5">
                    Choose Play, Task, Daily, Weekly, or Monthly. After you set a target and date, the amount you need to save shows under the deadline.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Target Amount (USDC)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Lock Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newGoalDeadline}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red"
                  />
                  <SavePlanHint target={targetNum} deadline={newGoalDeadline} cadence={newGoalCadence} />
                </div>

                {createError && <p className="text-xs text-red font-semibold text-center">{createError}</p>}

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 px-4 rounded-xl bg-red text-white text-xs font-semibold glow-red disabled:opacity-60"
                  >
                    {creating ? "Creating…" : "Create Goal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
