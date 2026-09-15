"use client";

import type { SaveCadence } from "@/lib/utils";
import {
  CADENCE_LABELS,
  SAVE_CADENCES,
  formatDeadline,
  formatUsdc,
  isRecurringCadence,
  suggestedSaveAmount,
} from "@/lib/utils";

const HINTS: Record<SaveCadence, string> = {
  play: "Save whenever you want",
  task: "One-time savings task",
  daily: "Set aside a little every day",
  weekly: "Set aside an amount each week",
  monthly: "Set aside an amount each month",
};

export function CadencePicker({
  value,
  onChange,
}: {
  value: SaveCadence;
  onChange: (c: SaveCadence) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {SAVE_CADENCES.map((cadence) => (
        <button
          key={cadence}
          type="button"
          onClick={() => onChange(cadence)}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            value === cadence
              ? "bg-red/20 border-red text-white"
              : "bg-black/40 border-white/10 text-white/50 hover:border-white/20"
          }`}
        >
          <span className="block text-xs font-semibold">{CADENCE_LABELS[cadence]}</span>
          <span className="block text-[10px] text-white/40 mt-0.5 leading-snug">{HINTS[cadence]}</span>
        </button>
      ))}
    </div>
  );
}

export function SavePlanHint({
  target,
  deadline,
  cadence,
  alreadySaved = 0,
}: {
  target: number;
  deadline: string;
  cadence: SaveCadence;
  alreadySaved?: number;
}) {
  const amount = suggestedSaveAmount(target, deadline, cadence, alreadySaved);
  if (amount === null) {
    return (
      <p className="text-[11px] text-white/35 mt-2">
        Set a target amount and deadline to see how much to save.
      </p>
    );
  }

  const recurring = isRecurringCadence(cadence);
  const perLabel =
    cadence === "daily" ? "/ day" : cadence === "weekly" ? "/ week" : cadence === "monthly" ? "/ month" : "";

  return (
    <div className="mt-3 px-3.5 py-3 rounded-xl bg-red/10 border border-red/25">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">
        {recurring ? `${CADENCE_LABELS[cadence]} amount to reach target` : "Amount remaining"}
      </p>
      <p className="text-lg font-extrabold text-white tabular-nums">
        {formatUsdc(amount)}{" "}
        <span className="text-xs font-semibold text-white/60">USDC{recurring ? ` ${perLabel}` : ""}</span>
      </p>
      <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
        {recurring ? (
          <>
            Save this {cadence} to reach{" "}
            <span className="font-semibold text-white">{formatUsdc(target)} USDC</span>
            {deadline ? (
              <>
                {" "}
                by <span className="font-semibold text-white">{formatDeadline(deadline)}</span>
              </>
            ) : null}
            .
          </>
        ) : (
          <>
            {CADENCE_LABELS[cadence]} plan — deposit toward{" "}
            <span className="font-semibold text-white">{formatUsdc(target)} USDC</span>
            {deadline ? (
              <>
                {" "}
                by <span className="font-semibold text-white">{formatDeadline(deadline)}</span>
              </>
            ) : null}
            .
          </>
        )}
      </p>
    </div>
  );
}
