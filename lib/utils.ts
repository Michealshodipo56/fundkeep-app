export type SaveCadence = "play" | "task" | "daily" | "weekly" | "monthly";

export const SAVE_CADENCES: SaveCadence[] = ["play", "task", "daily", "weekly", "monthly"];

export const CADENCE_LABELS: Record<SaveCadence, string> = {
  play: "Play",
  task: "Task",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function isRecurringCadence(cadence: SaveCadence): cadence is "daily" | "weekly" | "monthly" {
  return cadence === "daily" || cadence === "weekly" || cadence === "monthly";
}

export function shortAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDeadline(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

export function timeAgo(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours >= 1) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  if (mins >= 1) return `${mins} min ago`;
  return "Just now";
}

export function formatUsdc(amount: number): string {
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(isoDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
}

export function periodsUntilDeadline(deadlineIso: string, cadence: SaveCadence): number {
  const days = Math.max(1, daysUntil(deadlineIso));
  if (cadence === "daily") return days;
  if (cadence === "weekly") return Math.max(1, Math.ceil(days / 7));
  if (cadence === "monthly") return Math.max(1, Math.ceil(days / 30));
  return 1;
}

/** Amount the user must save each period (or in total for Play/Task) to hit `target` by `deadline`. */
export function suggestedSaveAmount(
  target: number,
  deadlineIso: string,
  cadence: SaveCadence,
  alreadySaved = 0
): number | null {
  if (!target || target <= 0 || !deadlineIso) return null;
  const remaining = Math.max(0, target - alreadySaved);
  if (!isRecurringCadence(cadence)) return remaining;
  const periods = periodsUntilDeadline(deadlineIso, cadence);
  if (periods <= 0) return remaining;
  return remaining / periods;
}

export function configuredNetwork(): "TESTNET" | "PUBLIC" {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "PUBLIC" : "TESTNET";
}
