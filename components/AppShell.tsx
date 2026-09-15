"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { configuredNetwork, shortAddress } from "@/lib/utils";

export type AppNavKey =
  | "dashboard"
  | "goals"
  | "deposit"
  | "activity"
  | "analytics"
  | "settings";

const NAV: { key: AppNavKey; href: string; label: string; icon: ReactNode }[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "goals",
    href: "/goals",
    label: "My Goals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "deposit",
    href: "/deposit",
    label: "Deposit",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M16 12h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "activity",
    href: "/activity",
    label: "Activity",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "analytics",
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AppShell({
  current,
  children,
}: {
  current: AppNavKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const { walletAddress, disconnect, hydrated, isOnChain } = useWallet();
  const network = configuredNetwork();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!walletAddress) router.replace("/auth");
  }, [hydrated, walletAddress, router]);

  const handleCopyWallet = useCallback(() => {
    if (!walletAddress) return;
    navigator.clipboard?.writeText(walletAddress);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  }, [walletAddress]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    router.push("/auth");
  }, [disconnect, router]);

  if (!hydrated || !walletAddress) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
          <p className="text-xs text-white/40">Loading wallet…</p>
        </div>
      </div>
    );
  }

  const displayAddress = shortAddress(walletAddress);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row selection:bg-red selection:text-white font-sans">
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-[#111] border-b border-white/10 sticky top-0 z-[60]">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="FundKeep logo" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold">
            Fund<span className="text-red">Keep</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-white"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
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

      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/10 flex flex-col p-5 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen overflow-y-auto`}
      >
        <div className="flex flex-col min-h-full justify-between gap-6">
          <div className="flex flex-col gap-8">
            <Link href="/" className="flex items-center gap-2.5 px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="FundKeep logo" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold tracking-tight">
                Fund<span className="text-red">Keep</span>
              </span>
            </Link>

            <nav className="flex flex-col gap-1.5" aria-label="Sidebar navigation">
              {NAV.map((item) => {
                const active = current === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-red/15 text-white border border-red/30 shadow-[0_0_15px_rgba(224,52,42,0.15)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
            {!isOnChain && (
              <p className="text-[10px] text-amber-400/90 px-1">
                Local mode — contract ID is not configured, so changes stay on this device.
              </p>
            )}
            <div className="p-3.5 rounded-2xl bg-[#161616] border border-white/10">
              <p className="text-[11px] font-semibold text-white/50 mb-1">Connected Wallet</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white tracking-wide">{displayAddress}</span>
                <button
                  type="button"
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
              type="button"
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
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
