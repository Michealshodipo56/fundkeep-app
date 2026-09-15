"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWallet, type TxReceipt } from "@/lib/wallet-context";
import { AppShell } from "@/components/AppShell";
import { TxReceiptCard } from "@/components/TxReceiptCard";
import { CADENCE_LABELS, formatUsdc } from "@/lib/utils";
import { USDC_MAX, USDC_MIN } from "@/lib/validation";

function DepositFormContent() {
  const searchParams = useSearchParams();
  const initialGoalId = searchParams.get("goalId") || "";
  const { goals, depositToGoal, usdcBalance, usdcBalanceLoading, usdcBalanceError, refreshUsdcBalance } =
    useWallet();

  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositReceipt, setDepositReceipt] = useState<TxReceipt | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const lockedGoals = goals.filter((g) => g.status === "LOCKED");
  const urlGoalValid = Boolean(initialGoalId && lockedGoals.some((g) => g.id === initialGoalId));
  const effectiveGoalId =
    selectedGoalId ||
    (urlGoalValid ? initialGoalId : "") ||
    lockedGoals[0]?.id ||
    "";
  const selectedGoal = goals.find((g) => g.id === effectiveGoalId);
  const amountNum = parseFloat(depositAmount || "0");
  const currentPercent = selectedGoal
    ? Math.min(100, Math.round((selectedGoal.saved / selectedGoal.target) * 100) || 0)
    : 0;
  const newSaved = selectedGoal ? selectedGoal.saved + (Number.isFinite(amountNum) ? amountNum : 0) : 0;
  const newPercent = selectedGoal
    ? Math.min(100, Math.round((newSaved / selectedGoal.target) * 100) || 0)
    : 0;

  const remaining = selectedGoal ? Math.max(0, selectedGoal.target - selectedGoal.saved) : 0;
  const exceedsHorizon =
    usdcBalance !== null && Number.isFinite(amountNum) && amountNum > usdcBalance + 1e-9;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) {
      setDepositError("Select a locked goal first.");
      return;
    }
    setIsSubmitting(true);
    setDepositError(null);
    setDepositReceipt(null);
    try {
      const receipt = await depositToGoal(selectedGoal.id, Number(depositAmount));
      setDepositReceipt(receipt);
      setDepositAmount("");
      void refreshUsdcBalance();
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : "Failed to deposit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell current="deposit">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Deposit to Goal</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
            Add USDC from your wallet. Funds stay locked until the goal unlocks.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 rounded-2xl bg-[#141414] border border-white/10 p-6 sm:p-8">
            {lockedGoals.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                <p className="mb-4">You have no locked goals to deposit into.</p>
                <Link href="/goals/create" className="px-4 py-2.5 rounded-xl bg-red text-white text-xs font-bold">
                  Create a Goal
                </Link>
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Select Goal</label>
                  <select
                    value={effectiveGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-white/10 text-sm text-white"
                  >
                    {lockedGoals.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#141414]">
                        {g.title} — {formatUsdc(g.saved)} / {formatUsdc(g.target)} USDC
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/70">Deposit Amount</label>
                    <span className="text-[11px] text-white/40 flex items-center gap-2">
                      Wallet USDC:{" "}
                      {usdcBalanceLoading
                        ? "…"
                        : usdcBalance === null
                        ? "Unavailable"
                        : `${formatUsdc(usdcBalance)} USDC`}
                      <button
                        type="button"
                        onClick={() => void refreshUsdcBalance()}
                        disabled={usdcBalanceLoading}
                        className="text-red font-semibold hover:underline disabled:opacity-50"
                      >
                        Refresh
                      </button>
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min={USDC_MIN}
                    max={Math.min(USDC_MAX, remaining || USDC_MAX)}
                    required
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setDepositReceipt(null);
                    }}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-white/20 font-mono font-bold focus:outline-none focus:border-red"
                  />
                  <p className="text-[11px] text-white/35 mt-2">
                    Remaining on this goal: {formatUsdc(remaining)} USDC
                  </p>
                  {usdcBalanceError && (
                    <p className="text-[11px] text-amber-300 mt-2">{usdcBalanceError}</p>
                  )}
                  {exceedsHorizon && (
                    <p className="text-[11px] text-amber-300 mt-2">
                      This amount is higher than the USDC trustline Horizon reports. Contract USDC can differ; the chain will reject the deposit if the wallet cannot pay.
                    </p>
                  )}
                </div>

                {selectedGoal && (
                  <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-white/40">Current</span>
                      <span className="text-white">
                        {formatUsdc(selectedGoal.saved)} / {formatUsdc(selectedGoal.target)} ({currentPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">After deposit</span>
                      <span className="text-emerald-400">
                        {formatUsdc(newSaved)} / {formatUsdc(selectedGoal.target)} ({newPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {depositError && <p className="text-xs text-red font-semibold">{depositError}</p>}
                {depositReceipt && <TxReceiptCard receipt={depositReceipt} />}

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedGoal}
                  className="w-full py-4 rounded-xl bg-red text-white text-sm font-bold glow-red disabled:opacity-60"
                >
                  {isSubmitting ? "Waiting for Stellar confirmation…" : "Deposit USDC"}
                </button>
              </form>
            )}
          </section>

          <section className="lg:col-span-5 rounded-2xl bg-[#141414] border border-white/10 p-6 text-xs">
            <h3 className="text-base font-bold text-white mb-3">Selected Goal</h3>
            {selectedGoal ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-white">{selectedGoal.title}</p>
                <p className="text-white/40">{CADENCE_LABELS[selectedGoal.cadence]} plan</p>
                <p className="text-white">
                  {formatUsdc(selectedGoal.saved)} / {formatUsdc(selectedGoal.target)} USDC
                </p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red/20 text-red w-fit">
                  {selectedGoal.status}
                </span>
              </div>
            ) : (
              <p className="text-white/40">No goal selected.</p>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

export default function DepositPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center text-xs text-white/40">
          Loading deposit form…
        </div>
      }
    >
      <DepositFormContent />
    </Suspense>
  );
}
