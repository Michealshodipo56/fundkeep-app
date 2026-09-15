"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { CadencePicker, SavePlanHint } from "@/components/CadencePicker";
import { CADENCE_LABELS, formatDeadline, formatUsdc, type SaveCadence } from "@/lib/utils";

type UnlockType = "deadline" | "target";

export default function CreateGoalPage() {
  const router = useRouter();
  const { network, createGoal } = useWallet();

  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [cadence, setCadence] = useState<SaveCadence>("weekly");
  const [targetAmount, setTargetAmount] = useState("");
  const [unlockCondition, setUnlockCondition] = useState<UnlockType>("deadline");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const targetNum = parseFloat(targetAmount || "0");
  const TARGET_ONLY_DEADLINE = "2036-12-31";
  const effectiveDeadline = unlockCondition === "deadline" ? deadlineDate : TARGET_ONLY_DEADLINE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;
    if (unlockCondition === "deadline" && !deadlineDate) {
      setCreateError("Pick a deadline date.");
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      await createGoal({
        title: goalName,
        description: goalDescription,
        cadence,
        target: parseFloat(targetAmount),
        deadline: effectiveDeadline,
      });
      setCreatedSuccess(true);
      setTimeout(() => router.push("/goals"), 1000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell current="goals">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-[#161616] border border-white/10 hover:border-white/20 flex items-center justify-center text-white/70 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Create New Goal</h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
                Set your savings goal and lock your funds on Stellar.
              </p>
            </div>
          </div>
          <Link
            href="/goals"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-xs sm:text-sm font-semibold"
          >
            View My Goals
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-2xl bg-[#141414] border border-white/10 p-6 sm:p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-bold text-white">Goal Details</h2>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Goal Name</label>
                  <input
                    type="text"
                    required
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Emergency Fund"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Save plan</label>
                  <CadencePicker value={cadence} onChange={setCadence} />
                  <p className="text-[11px] text-white/35 mt-1.5">
                    Play, Task, Daily, Weekly, or Monthly. The amount you need to save appears under the deadline once the target and date are set.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">
                    Description <span className="text-white/30 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={120}
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="Add a short description..."
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-base font-bold text-white">Target Amount</h2>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-base font-bold text-white">Unlock Condition</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUnlockCondition("deadline")}
                    className={`p-4 rounded-xl border text-left ${
                      unlockCondition === "deadline"
                        ? "bg-red/10 border-red text-white"
                        : "bg-black/40 border-white/10 text-white/60"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Set a Deadline</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Unlocks when the date passes.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlockCondition("target")}
                    className={`p-4 rounded-xl border text-left ${
                      unlockCondition === "target"
                        ? "bg-red/10 border-red text-white"
                        : "bg-black/40 border-white/10 text-white/60"
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Target Only</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Unlocks when the target is reached.</p>
                  </button>
                </div>
                {unlockCondition === "deadline" && (
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-2">Deadline Date</label>
                    <input
                      type="date"
                      required
                      value={deadlineDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-red"
                    />
                    <SavePlanHint target={targetNum} deadline={deadlineDate} cadence={cadence} />
                  </div>
                )}
                {unlockCondition === "target" && (
                  <SavePlanHint target={targetNum} deadline={effectiveDeadline} cadence={cadence} />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-red text-white text-sm font-bold glow-red disabled:opacity-60 min-h-[54px]"
              >
                {isSubmitting ? "Creating Goal on Stellar..." : "Create Savings Goal"}
              </button>

              {createdSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs text-emerald-400 font-semibold"
                >
                  Savings goal created. Redirecting…
                </motion.div>
              )}
              {createError && (
                <p className="p-4 rounded-xl bg-red/10 border border-red/30 text-center text-xs text-red font-semibold">
                  {createError}
                </p>
              )}
            </form>
          </section>

          <section className="lg:col-span-5">
            <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-white">Goal Preview</h3>
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/50 border border-white/5 text-xs">
                <div>
                  <p className="text-[10px] text-white/40">Goal Name</p>
                  <p className="text-xs font-bold text-white">{goalName || "Untitled Goal"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">Save plan</p>
                  <p className="text-xs font-bold text-white">{CADENCE_LABELS[cadence]}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">Target Amount</p>
                  <p className="text-xs font-bold text-white">{formatUsdc(targetNum)} USDC</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">Unlock</p>
                  <p className="text-xs font-bold text-white">
                    {unlockCondition === "deadline"
                      ? deadlineDate
                        ? `Deadline: ${formatDeadline(deadlineDate)}`
                        : "Pick a deadline"
                      : "When target is reached"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40">Network</p>
                  <p className="text-xs font-bold text-white">{network}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
