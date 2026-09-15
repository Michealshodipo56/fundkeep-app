"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { configuredNetwork, formatUsdc, shortAddress } from "@/lib/utils";

type TabType = "profile" | "preferences" | "security";

export default function SettingsPage() {
  const router = useRouter();
  const {
    walletAddress,
    stats,
    profile,
    setDisplayName,
    setAnimations,
    disconnect,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [saved, setSaved] = useState(false);
  const configured = configuredNetwork();

  const handleSaveName = () => {
    setDisplayName(nameDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = (profile.displayName || shortAddress(walletAddress || "FK"))
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell current="settings">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
            Wallet identity, network, and security.
          </p>
        </header>

        <div className="flex items-center gap-6 border-b border-white/10 text-xs font-semibold">
          {(["profile", "preferences", "security"] as TabType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 capitalize ${
                activeTab === tab ? "text-white font-bold border-b-2 border-red" : "text-white/40"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 flex flex-col gap-6">
            {activeTab === "profile" && (
              <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-bold text-white">Profile</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    Identity comes from your connected Stellar wallet. A display name is optional and stored only on this device.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red/60 to-[#5a120e] flex items-center justify-center text-white text-xl font-extrabold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {profile.displayName || shortAddress(walletAddress || "")}
                    </p>
                    <p className="text-xs font-mono text-white/50 mt-0.5">{walletAddress}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Display name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder="Optional nickname"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-red"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="px-4 py-2 rounded-xl bg-red text-white text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                  {saved && <p className="text-[11px] text-emerald-400 mt-2">Saved on this device.</p>}
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-5">
                <h2 className="text-base font-bold text-white">Preferences</h2>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Currency</p>
                    <p className="text-[11px] text-white/40">FundKeep locks USDC only.</p>
                  </div>
                  <span className="text-xs font-bold text-white">USDC</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Stellar Network</p>
                    <p className="text-[11px] text-white/40">
                      This deployment is locked to {configured}. Set Freighter to the same network before connecting.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-md bg-red text-white text-[10px] font-bold">
                    {configured === "PUBLIC" ? "MAINNET" : "TESTNET"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-bold text-white">Animations</p>
                    <p className="text-[11px] text-white/40">Interface motion on this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnimations(!profile.animations)}
                    className={`w-12 h-6 rounded-full relative p-1 ${profile.animations ? "bg-red" : "bg-white/10"}`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        profile.animations ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-4 text-xs">
                <h2 className="text-base font-bold text-white">Security</h2>
                <p className="text-white/50">
                  FundKeep is non-custodial. Your keys stay in Freighter. We never store a password, seed phrase, or email login.
                </p>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/40">Connected address</span>
                  <span className="font-mono text-white">{shortAddress(walletAddress || "")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/40">Custody</span>
                  <span className="text-white">Your wallet</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnect();
                    router.push("/auth");
                  }}
                  className="mt-2 py-3 rounded-xl border border-red/30 bg-red/10 text-red font-bold"
                >
                  Disconnect wallet
                </button>
              </div>
            )}
          </section>

          <section className="lg:col-span-4 rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-3 text-xs">
            <h3 className="text-base font-bold text-white">Account Summary</h3>
            <div className="flex justify-between">
              <span className="text-white/40">Active Goals</span>
              <span className="font-bold text-white">{stats.activeGoals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Completed</span>
              <span className="font-bold text-white">{stats.completedGoals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Total Saved</span>
              <span className="font-bold text-white">{formatUsdc(stats.totalSaved)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Locked</span>
              <span className="font-bold text-white">{formatUsdc(stats.lockedFunds)} USDC</span>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
