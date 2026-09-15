"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TxReceiptCard } from "@/components/TxReceiptCard";
import { type ActivityEntry, type TxReceipt, useWallet } from "@/lib/wallet-context";
import {
  CADENCE_LABELS,
  daysUntil,
  formatDeadline,
  formatUsdc,
  suggestedSaveAmount,
  timeAgo,
} from "@/lib/utils";
import { USDC_MAX, USDC_MIN } from "@/lib/validation";

function activityLabel(entry: ActivityEntry): string {
  if (entry.type === "create") return "Goal created";
  if (entry.type === "deposit") return "Funds deposited";
  if (entry.type === "unlock") return "Goal unlocked";
  return "Funds withdrawn";
}

function statusClass(status: "LOCKED" | "UNLOCKED" | "WITHDRAWN"): string {
  if (status === "LOCKED") return "bg-red/20 text-red border-red/30";
  if (status === "UNLOCKED") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  return "bg-white/10 text-white/60 border-white/15";
}

export default function GoalDetailPage({ goalId }: { goalId: string }) {
  const {
    goals,
    activity,
    depositToGoal,
    withdrawGoal,
    usdcBalance,
    usdcBalanceLoading,
    usdcBalanceError,
    refreshUsdcBalance,
  } = useWallet();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);

  const goal = goals.find((item) => item.id === goalId);
  const goalActivity = useMemo(
    () => activity.filter((entry) => entry.goalId === goalId),
    [activity, goalId]
  );

  if (!goal) {
    return (
      <AppShell current="goals">
        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          <section className="p-10 rounded-2xl bg-[#141414] border border-white/10 text-center">
            <h1 className="text-xl font-bold text-white">Goal not found</h1>
            <p className="text-sm text-white/45 mt-2">This goal is not available for the connected wallet.</p>
            <Link href="/goals" className="inline-flex mt-5 px-4 py-2.5 rounded-xl bg-red text-sm font-bold text-white">
              Back to My Goals
            </Link>
          </section>
        </main>
      </AppShell>
    );
  }

  const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100) || 0);
  const remaining = Math.max(0, goal.target - goal.saved);
  const suggested = suggestedSaveAmount(goal.target, goal.deadline, goal.cadence, goal.saved);
  const deadlineDays = daysUntil(goal.deadline);
  const amountNumber = Number(amount);
  const exceedsBalance = usdcBalance !== null && Number.isFinite(amountNumber) && amountNumber > usdcBalance;

  const handleDeposit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setReceipt(null);
    try {
      const result = await depositToGoal(goal.id, amountNumber);
      setReceipt(result);
      setAmount("");
      void refreshUsdcBalance();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not deposit funds.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    setError(null);
    setReceipt(null);
    try {
      setReceipt(await withdrawGoal(goal.id));
      void refreshUsdcBalance();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not withdraw funds.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell current="goals">
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/goals" aria-label="Back to My Goals" className="w-10 h-10 rounded-xl bg-[#161616] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div>
              <p className="text-xs text-white/45 font-medium">Savings goal</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{goal.title}</h1>
            </div>
          </div>
          <span className={`w-fit px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide ${statusClass(goal.status)}`}>{goal.status}</span>
        </header>

        <section className="rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                {goal.description && <p className="text-sm text-white/55 max-w-2xl">{goal.description}</p>}
                <p className="text-xs text-white/40 mt-2">{CADENCE_LABELS[goal.cadence]} saving plan · Deadline {formatDeadline(goal.deadline)}</p>
              </div>
              <p className="text-xs text-white/45">{deadlineDays < 0 ? "Deadline passed" : deadlineDays === 0 ? "Deadline today" : `${deadlineDays} days remaining`}</p>
            </div>
            <div>
              <div className="flex items-end justify-between gap-4">
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{formatUsdc(goal.saved)} <span className="text-base font-medium text-white/40">/ {formatUsdc(goal.target)} USDC</span></p>
                <p className="text-sm font-bold text-red">{percent}%</p>
              </div>
              <div className="mt-3 h-3 rounded-full bg-black/50 overflow-hidden"><div className="h-full bg-red rounded-full transition-[width] duration-500" style={{ width: `${percent}%` }} /></div>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-white/45">
                <span>{formatUsdc(remaining)} USDC left to reach your target</span>
                {goal.status === "LOCKED" && suggested !== null && <span>Suggested: {formatUsdc(suggested)} USDC {goal.cadence === "daily" ? "/ day" : goal.cadence === "weekly" ? "/ week" : goal.cadence === "monthly" ? "/ month" : "remaining"}</span>}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <section className="lg:col-span-3 rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-7">
            {goal.status === "LOCKED" && (
              <form onSubmit={handleDeposit} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-white">Fund this goal</h2>
                  <p className="text-xs text-white/45 mt-1">USDC stays locked in the contract until this goal unlocks.</p>
                </div>
                <div>
                  <div className="flex justify-between gap-3 mb-2 text-xs">
                    <label htmlFor="goal-deposit" className="font-semibold text-white/70">Deposit amount</label>
                    <span className="text-white/45">Wallet USDC: {usdcBalanceLoading ? "…" : usdcBalance === null ? "Unavailable" : formatUsdc(usdcBalance)}</span>
                  </div>
                  <input id="goal-deposit" type="number" inputMode="decimal" step="0.0000001" min={USDC_MIN} max={Math.min(USDC_MAX, remaining)} required value={amount} onChange={(event) => { setAmount(event.target.value); setReceipt(null); }} placeholder="0.00" className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-white/20 font-mono font-bold focus:outline-none focus:border-red" />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-white/40">Maximum for this goal: {formatUsdc(remaining)} USDC</span>
                    <button type="button" onClick={() => setAmount(remaining.toFixed(2))} className="text-red font-semibold hover:underline">Use remaining amount</button>
                  </div>
                  {usdcBalanceError && <p className="text-xs text-amber-300 mt-3">{usdcBalanceError}</p>}
                  {exceedsBalance && <p className="text-xs text-amber-300 mt-3">This is higher than your displayed wallet balance. The contract will reject it if the wallet cannot pay.</p>}
                </div>
                {error && <p className="text-xs text-red font-semibold">{error}</p>}
                {receipt && <TxReceiptCard receipt={receipt} />}
                <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-red text-white text-sm font-bold glow-red disabled:opacity-60">{submitting ? "Waiting for Stellar confirmation…" : "Fund Goal with USDC"}</button>
              </form>
            )}
            {goal.status === "UNLOCKED" && (
              <div className="flex flex-col gap-5">
                <div><h2 className="text-lg font-bold text-white">Your funds are ready</h2><p className="text-xs text-white/45 mt-1">This goal is unlocked. Withdraw the full balance back to your wallet.</p></div>
                {error && <p className="text-xs text-red font-semibold">{error}</p>}
                {receipt && <TxReceiptCard receipt={receipt} />}
                <button type="button" onClick={handleWithdraw} disabled={submitting} className="w-full py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold disabled:opacity-60">{submitting ? "Waiting for Stellar confirmation…" : `Withdraw ${formatUsdc(goal.saved)} USDC`}</button>
              </div>
            )}
            {goal.status === "WITHDRAWN" && <div><h2 className="text-lg font-bold text-white">Goal completed</h2><p className="text-xs text-white/45 mt-1">The funds have been returned to your wallet.</p></div>}
          </section>

          <section className="lg:col-span-2 rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-6">
            <h2 className="text-base font-bold text-white">Goal activity</h2>
            {goalActivity.length === 0 ? <p className="text-xs text-white/40 mt-4">No activity recorded yet.</p> : <ol className="mt-4 flex flex-col gap-4">{goalActivity.map((entry) => <li key={entry.id} className="border-l border-white/10 pl-3"><p className="text-xs font-semibold text-white">{activityLabel(entry)}</p>{entry.amount !== undefined && <p className="text-xs text-white/50 mt-0.5">{formatUsdc(entry.amount)} USDC</p>}<p className="text-[11px] text-white/35 mt-1">{timeAgo(entry.timestamp)}</p></li>)}</ol>}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
