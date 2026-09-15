"use client";

import { useWallet } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { formatUsdc } from "@/lib/utils";

export default function AnalyticsPage() {
  const { goals, stats, activity } = useWallet();
  const locked = goals.filter((g) => g.status === "LOCKED").length;
  const unlocked = goals.filter((g) => g.status === "UNLOCKED").length;
  const withdrawn = goals.filter((g) => g.status === "WITHDRAWN").length;
  const deposits = activity.filter((a) => a.type === "deposit").length;

  return (
    <AppShell current="analytics">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Analytics</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
            Breakdown of this wallet’s goals and activity.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Locked goals", value: String(locked) },
            { label: "Unlocked goals", value: String(unlocked) },
            { label: "Withdrawn", value: String(withdrawn) },
            { label: "Deposits", value: String(deposits) },
          ].map((card) => (
            <div key={card.label} className="p-5 rounded-2xl bg-[#141414] border border-white/10">
              <p className="text-xs text-white/50">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-[#141414] border border-white/10 p-6">
          <h2 className="text-base font-bold text-white mb-4">Progress by goal</h2>
          {goals.length === 0 ? (
            <p className="text-xs text-white/40">No goals yet for this wallet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100) || 0);
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white font-semibold">{goal.title}</span>
                      <span className="text-white/50">
                        {formatUsdc(goal.saved)} / {formatUsdc(goal.target)} · {percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-red rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[#141414] border border-white/10 p-6 text-xs">
          <h2 className="text-base font-bold text-white mb-3">Totals</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-white/40">Total saved</span>
              <span className="font-bold text-white">{formatUsdc(stats.totalSaved)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Total target</span>
              <span className="font-bold text-white">{formatUsdc(stats.totalTarget)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Overall</span>
              <span className="font-bold text-white">{stats.overallPercent}%</span>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
