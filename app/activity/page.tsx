"use client";

import { useState } from "react";
import { useWallet, type ActivityEntry } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { formatUsdc, timeAgo } from "@/lib/utils";

type TabType = "all" | "deposits" | "withdrawals" | "updates";

function activityTitle(type: ActivityEntry["type"]): string {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdraw":
      return "Withdrawal";
    case "unlock":
      return "Goal Unlocked";
    case "create":
      return "Goal Created";
  }
}

export default function ActivityPage() {
  const { activity, stats } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredActivity = activity.filter((item) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "deposits" && item.type === "deposit") ||
      (activeTab === "withdrawals" && item.type === "withdraw") ||
      (activeTab === "updates" && (item.type === "unlock" || item.type === "create"));
    const matchesSearch = item.goalTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <AppShell current="activity">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Activity</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
            Your deposits, unlocks, and withdrawals.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 rounded-2xl bg-[#141414] border border-white/10 p-5 sm:p-6 flex flex-col gap-6">
            <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto pb-2 text-xs font-semibold">
              {[
                { id: "all", label: "All Activity" },
                { id: "deposits", label: "Deposits" },
                { id: "withdrawals", label: "Withdrawals" },
                { id: "updates", label: "Goal Updates" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`pb-2 whitespace-nowrap ${
                    activeTab === tab.id ? "text-white font-bold border-b-2 border-red" : "text-white/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red"
            />

            <div className="flex flex-col gap-2">
              {filteredActivity.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-8">No activity yet for this wallet.</p>
              ) : (
                filteredActivity.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{activityTitle(item.type)}</p>
                      <p className="text-[11px] text-white/40">{item.goalTitle}</p>
                    </div>
                    <div className="text-right">
                      {item.amount !== undefined && (
                        <p className="text-xs font-bold text-red">
                          {item.type === "withdraw" ? "-" : "+"}
                          {formatUsdc(item.amount)} USDC
                        </p>
                      )}
                      <p className="text-[10px] text-white/40">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="lg:col-span-4 rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-3 text-xs">
            <h3 className="text-base font-bold text-white">Summary</h3>
            <div className="flex justify-between">
              <span className="text-white/40">Active Goals</span>
              <span className="font-bold text-white">{stats.activeGoals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Total Saved</span>
              <span className="font-bold text-white">{formatUsdc(stats.totalSaved)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Events</span>
              <span className="font-bold text-white">{activity.length}</span>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
