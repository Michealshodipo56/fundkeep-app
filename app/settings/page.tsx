"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";

type TabType = "profile" | "preferences" | "security";

function shortAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const { walletAddress, network, setNetwork, disconnect, stats } = useWallet();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Form states
  const [currency, setCurrency] = useState("USDC");
  const [animations, setAnimations] = useState(true);

  // Edit Profile modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState("FundKeep Account");
  const [email, setEmail] = useState("account@fundkeep.org");

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

  const displayAddress = walletAddress ? shortAddress(walletAddress) : "Not Connected";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row selection:bg-red selection:text-white font-sans">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-[#111] border-b border-white/10 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="FundKeep logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="FundKeep logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
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

            {/* Active Settings Item */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-red/15 text-white border border-red/30 shadow-[0_0_15px_rgba(224,52,42,0.15)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </div>
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
        {/* TOP HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
              Manage your account, preferences, and security.
            </p>
          </div>
        </header>

        {/* SUB-TABS BAR */}
        <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto scrollbar-none pb-2 text-xs font-semibold">
          {[
            { id: "profile", label: "Profile" },
            { id: "preferences", label: "Preferences" },
            { id: "security", label: "Security" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-2 whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? "text-white font-bold"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-red rounded-full shadow-[0_0_8px_rgba(224,52,42,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLUMNS: MAIN SETTINGS CARDS */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            {/* CARD 1: PROFILE INFORMATION */}
            <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-6 shadow-xl relative">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Profile Information</h2>
                  <p className="text-xs text-white/40 mt-0.5">Update your account details and profile information.</p>
                </div>

                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all"
                >
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red/60 via-red to-[#5a120e] flex items-center justify-center text-white text-2xl font-extrabold shadow-[0_0_25px_rgba(224,52,42,0.4)]">
                  {fullName.split(" ").map((n) => n[0]).join("")}
                </div>

                <div className="flex flex-col gap-2 text-center sm:text-left flex-1">
                  <div>
                    <h3 className="text-lg font-bold text-white">{fullName}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{email}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-white/80 flex items-center gap-1.5">
                      {displayAddress}
                      {walletAddress && (
                        <button onClick={handleCopyWallet} className="hover:text-white">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      )}
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      {network}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PREFERENCES */}
            <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-6 shadow-xl">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Preferences</h2>
                <p className="text-xs text-white/40 mt-0.5">Customize your experience on FundKeep.</p>
              </div>

              <div className="flex flex-col gap-5 text-xs">
                {/* Setting 1: Currency */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div>
                    <p className="font-bold text-white">Currency</p>
                    <p className="text-white/40 text-[11px]">Display currency preference.</p>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-black/60 border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-red"
                  >
                    <option value="USDC">USDC</option>
                    <option value="XLM">XLM</option>
                  </select>
                </div>

                {/* Setting 2: Default Network */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div>
                    <p className="font-bold text-white">Stellar Network</p>
                    <p className="text-white/40 text-[11px]">Toggle active network environment.</p>
                  </div>
                  <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setNetwork("TESTNET")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        network === "TESTNET" ? "bg-red text-white" : "text-white/40 hover:text-white"
                      }`}
                    >
                      TESTNET
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetwork("PUBLIC")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        network === "PUBLIC" ? "bg-red text-white" : "text-white/40 hover:text-white"
                      }`}
                    >
                      MAINNET
                    </button>
                  </div>
                </div>

                {/* Setting 3: Animations Switch */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <p className="font-bold text-white">Animations</p>
                    <p className="text-white/40 text-[11px]">Enable interface transitions.</p>
                  </div>
                  <button
                    onClick={() => setAnimations(!animations)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      animations ? "bg-red" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        animations ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT 4 COLUMNS: ACCOUNT SUMMARY */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-4 shadow-xl">
              <h3 className="text-base font-bold text-white tracking-tight">Account Summary</h3>

              <div className="flex flex-col gap-2.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Active Goals</span>
                  <span className="font-bold text-white">{stats.activeGoals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Completed Goals</span>
                  <span className="font-bold text-white">{stats.completedGoals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Total Saved</span>
                  <span className="font-bold text-white">
                    {stats.totalSaved.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Total Locked</span>
                  <span className="font-bold text-white">
                    {stats.lockedFunds.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-white/70 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-red"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-red"
                />
              </div>

              <button
                onClick={() => setEditModalOpen(false)}
                className="w-full py-3 rounded-xl bg-red text-white font-bold hover:opacity-90 transition-all mt-2"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
