"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet, type SavingsGoal, type ActivityEntry } from "@/lib/wallet-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

function timeAgo(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours >= 1) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  if (mins >= 1) return `${mins} min ago`;
  return "Just now";
}

// ─── Category Icons ───────────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: SavingsGoal["category"] }) {
  const paths: Record<SavingsGoal["category"], React.ReactNode> = {
    laptop: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0342a" strokeWidth="2">
        <rect x="2" y="4" width="20" height="12" rx="2" />
        <path d="M2 20h20" strokeLinecap="round" />
      </svg>
    ),
    camera: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0342a" strokeWidth="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    travel: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0342a" strokeWidth="2">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-1 .1-1.3.5l-.8.8c-.3.4-.2 1 .2 1.3L8 12l-3.5 3.5-2.3-.5c-.4-.1-.8.1-1 .4l-.4.5c-.2.4-.1.8.2 1.1l3.5 3.5 3.5 3.5c.3.3.7.4 1.1.2l.5-.4c.3-.2.5-.6.4-1l-.5-2.3L12 16l2.7 4.6c.3.4.9.5 1.3.2l.8-.8c.4-.3.6-.8.5-1.3z" />
      </svg>
    ),
    other: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0342a" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
      </svg>
    ),
  };
  return <>{paths[category]}</>;
}

// ─── Activity Icon ────────────────────────────────────────────────────────────

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
  // create
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

// ─── Donut Chart ──────────────────────────────────────────────────────────────

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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const {
    walletAddress,
    network,
    disconnect,
    goals,
    createGoal,
    checkDeadlines,
    activity,
    stats,
  } = useWallet();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  // New goal form state
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<SavingsGoal["category"]>("laptop");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Redirect to auth if wallet not connected
  useEffect(() => {
    if (walletAddress === null) {
      // Give localStorage hydration a moment
      const timer = setTimeout(() => {
        if (!walletAddress) router.push("/auth");
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Check deadlines on mount
  useEffect(() => {
    checkDeadlines();
  }, [checkDeadlines]);

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

  const handleCreateGoal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGoalTitle || !newGoalTarget) return;
      setCreating(true);
      setCreateError(null);

      try {
        await createGoal({
          title: newGoalTitle,
          category: newGoalCategory,
          target: parseFloat(newGoalTarget),
          deadline: newGoalDeadline || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });

        setNewGoalTitle("");
        setNewGoalTarget("");
        setNewGoalDeadline("");
        setNewGoalCategory("laptop");
        setCreateModalOpen(false);
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Failed to create goal.");
      } finally {
        setCreating(false);
      }
    },
    [newGoalTitle, newGoalTarget, newGoalDeadline, newGoalCategory, createGoal]
  );

  const displayAddress = walletAddress ? shortAddress(walletAddress) : "—";
  const recentActivity = activity.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row selection:bg-red selection:text-white font-sans">
      {/* ---------------------------------------------------- */}
      {/* MOBILE HEADER */}
      {/* ---------------------------------------------------- */}
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

      {/* ---------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION */}
      {/* ---------------------------------------------------- */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/10 flex flex-col justify-between p-5 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
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

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5" aria-label="Sidebar navigation">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-red/15 text-white border border-red/30 shadow-[0_0_15px_rgba(224,52,42,0.15)] transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/goals"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              My Goals
            </Link>

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
          {/* Connected Wallet Box */}
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

          {/* Disconnect Button */}
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

      {/* Overlay background for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN DASHBOARD CONTENT AREA */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* TOP GREETING HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {getGreeting()}, {walletAddress ? shortAddress(walletAddress) : "Anon"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1 font-medium">
              Keep building toward your goals.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Notification Bell */}
            <button className="relative w-10 h-10 rounded-xl bg-[#161616] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/20 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {activity.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red ring-2 ring-[#161616]" />
              )}
            </button>

            {/* Create New Goal Button — opens modal */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red text-white text-xs sm:text-sm font-semibold transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(224,52,42,0.4)] glow-red"
            >
              <span className="text-base font-bold">+</span>
              Create New Goal
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* STATS OVERVIEW CARDS (4 METRICS) — all derived from live goals */}
        {/* ---------------------------------------------------- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Stats Overview">
          {/* Card 1: Total Saved */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="16" cy="12" r="2" />
                <path d="M6 12h.01" strokeWidth="3" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Total Saved</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">
                {stats.totalSaved.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-normal text-white/40">USDC</span>
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">Across all goals</p>
            </div>
          </div>

          {/* Card 2: Active Goals */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Active Goals</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">{stats.activeGoals}</p>
              <p className="text-[11px] text-white/40 mt-0.5">In progress</p>
            </div>
          </div>

          {/* Card 3: Locked Funds */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/30 flex items-center justify-center text-red shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Locked Funds</p>
              <p className="text-lg font-bold text-white mt-0.5 tracking-tight">
                {stats.lockedFunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-normal text-white/40">USDC</span>
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">Currently locked</p>
            </div>
          </div>

          {/* Card 4: Completed Goals */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
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

        {/* ---------------------------------------------------- */}
        {/* MAIN CONTENT GRID */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: MY GOALS LIST */}
          <section className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">My Goals</h2>
              <Link
                href="/goals"
                className="text-xs text-red font-semibold hover:underline flex items-center gap-1"
              >
                View all goals →
              </Link>
            </div>

            <div className="flex flex-col gap-3.5">
              {goals.length === 0 && (
                <div className="p-8 rounded-2xl bg-[#141414] border border-white/10 text-center text-white/40 text-sm">
                  No goals yet. Create your first savings goal!
                </div>
              )}

              {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
                const remaining = Math.max(0, goal.target - goal.saved);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        {/* Category Icon Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red/30 to-red/10 border border-red/30 flex items-center justify-center text-white shrink-0 shadow-inner">
                          <CategoryIcon category={goal.category} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
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
                          </div>
                          <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Deadline: {formatDeadline(goal.deadline)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold text-white">
                          {goal.saved.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                          <span className="text-xs font-normal text-white/50">USDC</span>
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          of {goal.target.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-red/80 to-red rounded-full shadow-[0_0_12px_rgba(224,52,42,0.8)]"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-xs">
                      <span className="font-semibold text-red">{percent}%</span>
                      <span className="text-white/40">
                        {goal.status === "WITHDRAWN"
                          ? "Withdrawn"
                          : goal.status === "UNLOCKED"
                          ? "Goal reached — ready to withdraw"
                          : `${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC remaining`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Dashed Create Goal CTA */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-red/40 hover:bg-red/5 transition-all text-xs font-bold text-white/60 hover:text-white flex items-center justify-center gap-2 group min-h-[54px]"
              >
                <span className="w-5 h-5 rounded-full bg-red/20 text-red flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                  +
                </span>
                Create New Goal
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN: DONUT CHART + RECENT ACTIVITY */}
          <section className="flex flex-col gap-6">
            {/* WIDGET 1: GOAL PROGRESS CIRCULAR DONUT */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">Goal Progress</h3>
                <span className="bg-black/60 border border-white/10 text-xs text-white/70 rounded-lg px-2.5 py-1">
                  All Goals
                </span>
              </div>

              {/* Donut Ring Chart — driven by real stats */}
              <div className="flex items-center justify-center py-2">
                <DonutChart percent={stats.overallPercent} />
              </div>

              {/* Legend & Summary */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="w-2.5 h-2.5 rounded-full bg-red shrink-0" />
                    Total Saved
                  </span>
                  <span className="font-bold text-white">
                    {stats.totalSaved.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20 shrink-0" />
                    Total Target
                  </span>
                  <span className="font-bold text-white">
                    {stats.totalTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                  </span>
                </div>

                {/* Remaining Pill Box */}
                <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/40">
                    {(stats.totalTarget - stats.totalSaved).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    USDC
                  </span>
                  <span className="text-white/60 font-medium">Remaining</span>
                </div>
              </div>
            </div>

            {/* WIDGET 2: RECENT ACTIVITY LIST */}
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
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          entry.type === "deposit"
                            ? "bg-red/10 border border-red/30 text-red"
                            : entry.type === "withdraw"
                            ? "bg-red/10 border border-red/30 text-red"
                            : "bg-white/5 border border-white/10 text-white/70"
                        }`}
                      >
                        <ActivityIcon type={entry.type} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{activityLabel(entry.type)}</p>
                        <p className="text-[11px] text-white/40">{entry.goalTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.amount !== undefined && (
                        <p
                          className={`text-xs font-bold ${
                            entry.type === "withdraw" ? "text-white" : "text-red"
                          }`}
                        >
                          {entry.type === "withdraw" ? "-" : "+"}
                          {entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
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

        {/* ---------------------------------------------------- */}
        {/* FOOTER STRIP */}
        {/* ---------------------------------------------------- */}
        <footer className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-8 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M7 12h10" />
            </svg>
            <span>Built on Stellar</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured by Soroban</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
              $
            </span>
            <span>USDC Only</span>
          </div>
        </footer>
      </main>

      {/* ---------------------------------------------------- */}
      {/* CREATE NEW GOAL MODAL */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden"
            >
              {/* Red glow header line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Create New Saving Goal</h2>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
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
                    placeholder="e.g., Emergency Fund"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red focus:ring-1 focus:ring-red transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Category Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["laptop", "camera", "travel", "other"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewGoalCategory(cat)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all capitalize ${
                          newGoalCategory === cat
                            ? "bg-red/20 border-red text-white"
                            : "bg-black/40 border-white/10 text-white/50"
                        }`}
                      >
                        {cat === "laptop" && "💻"}
                        {cat === "camera" && "📷"}
                        {cat === "travel" && "✈️"}
                        {cat === "other" && "🎯"}
                        <span className="hidden sm:inline">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      </button>
                    ))}
                  </div>
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
                    placeholder="1000.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red focus:ring-1 focus:ring-red transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">Lock Deadline Date</label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-red focus:ring-1 focus:ring-red transition-all"
                  />
                </div>

                {createError && (
                  <p className="text-xs text-red font-semibold text-center">{createError}</p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 px-4 rounded-xl bg-red text-white text-xs font-semibold glow-red hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {creating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Goal"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
