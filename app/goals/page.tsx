"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";

function shortAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function formatDeadline(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

export default function GoalsPage() {
  const router = useRouter();
  const {
    walletAddress,
    network,
    disconnect,
    goals,
    withdrawGoal,
  } = useWallet();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "locked" | "unlocked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleWithdraw = useCallback(
    async (goalId: string) => {
      setWithdrawingId(goalId);
      setWithdrawError(null);
      try {
        await withdrawGoal(goalId);
      } catch (err) {
        setWithdrawError(err instanceof Error ? err.message : "Failed to withdraw.");
      } finally {
        setWithdrawingId(null);
      }
    },
    [withdrawGoal]
  );

  const handleCopyWallet = useCallback(() => {
    if (walletAddress) {
      navigator.clipboard?.writeText(walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  }, [walletAddress]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    router.push("/auth");
  }, [disconnect, router]);

  const filteredGoals = goals.filter((goal) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "locked" && goal.status === "LOCKED") ||
      (activeFilter === "unlocked" && goal.status === "UNLOCKED");
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayAddress = walletAddress ? shortAddress(walletAddress) : "Not Connected";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row selection:bg-red selection:text-white font-sans">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-[#111] border-b border-white/10 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#181818] border border-red/40 flex items-center justify-center glow-red-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2a3 3 0 0 1 3 3v1H9V7a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
                fill="#e0342a"
              />
            </svg>
          </div>
          <span className="text-lg font-bold">
            Fund<span className="text-red">Keep</span>
          </span>
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/10 flex flex-col justify-between p-5 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen`}
      >
        <div className="flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-[#181818] border border-red/40 flex items-center justify-center glow-red-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C9.24 2 7 4.24 7 7v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2a3 3 0 0 1 3 3v1H9V7a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
                  fill="#e0342a"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Fund<span className="text-red">Keep</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1.5" aria-label="Sidebar navigation">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
              </svg>
              Dashboard
            </Link>

            {/* Active My Goals Item */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-red/15 text-white border border-red/30 shadow-[0_0_15px_rgba(224,52,42,0.15)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              My Goals
            </div>

            <Link
              href="/deposit"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M16 12h2" strokeLinecap="round" />
              </svg>
              Deposit
            </Link>

            <Link
              href="/activity"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
              </svg>
              Activity
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Analytics
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </Link>
          </nav>
        </div>

        {/* Bottom Sidebar Widgets */}
        <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-[#161616] border border-white/10">
            <p className="text-[11px] font-semibold text-white/50 mb-1">Connected Wallet</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                {displayAddress}
              </span>
              <button
                onClick={handleCopyWallet}
                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Copy Address"
              >
                {copiedWallet ? (
                  <span className="text-[10px] text-emerald-400 font-sans">Copied!</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {network}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-red/30 bg-red/10 hover:bg-red/20 text-red text-xs font-semibold transition-colors w-full"
          >
            <span>Disconnect</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Goals
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
              Manage and track all your locked savings goals on Stellar.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/goals/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red text-white text-xs sm:text-sm font-semibold transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(224,52,42,0.4)] glow-red"
            >
              <span className="text-base font-bold">+</span>
              Create New Goal
            </Link>
          </div>
        </header>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold">
            {[
              { id: "all", label: "All Goals" },
              { id: "locked", label: "Locked" },
              { id: "unlocked", label: "Unlocked" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as "all" | "locked" | "unlocked")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeFilter === f.id
                    ? "bg-red text-white font-bold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red transition-all"
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {withdrawError && (
          <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-center text-xs text-red font-semibold">
            {withdrawError}
          </div>
        )}

        {/* GOALS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="12" cy="12" r="5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{goal.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5">Deadline: {formatDeadline(goal.deadline)}</p>
                      </div>
                    </div>

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
                  </div>

                  <div className="flex items-baseline justify-between mt-4 mb-2">
                    <span className="text-xl font-bold text-white">
                      {goal.saved.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-normal text-white/40">USDC</span>
                    </span>
                    <span className="text-xs font-semibold text-red">{percent}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-red/80 to-red rounded-full"
                    />
                  </div>

                  <p className="text-right text-[11px] text-white/40 mt-1.5">
                    Target: {goal.target.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {goal.status === "UNLOCKED" ? (
                    <button
                      onClick={() => handleWithdraw(goal.id)}
                      disabled={withdrawingId === goal.id}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold text-center transition-colors disabled:opacity-60"
                    >
                      {withdrawingId === goal.id ? "Withdrawing..." : "Withdraw Funds"}
                    </button>
                  ) : goal.status === "WITHDRAWN" ? (
                    <span className="flex-1 py-2 px-3 text-xs text-white/40 font-semibold text-center">
                      Withdrawn
                    </span>
                  ) : (
                    <Link
                      href={`/deposit?goalId=${goal.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-red/10 border border-red/30 hover:bg-red/20 text-red text-xs font-bold text-center transition-colors"
                    >
                      Deposit USDC
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Create Goal Card */}
          <Link
            href="/goals/create"
            className="p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-red/40 hover:bg-red/5 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-red/20 text-red flex items-center justify-center text-xl font-bold">
              +
            </div>
            <div>
              <p className="text-sm font-bold text-white">Create New Savings Goal</p>
              <p className="text-xs text-white/40 mt-1">Lock funds on Stellar until your goal is reached.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
