import { SAVE_CADENCES, type SaveCadence } from "./utils";

export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 120;
export const DISPLAY_NAME_MAX_LENGTH = 40;
export const USDC_MIN = 0.01;
export const USDC_MAX = 1_000_000;
export const DEADLINE_MAX_YEARS = 12;

const USDC_PATTERN = /^\d+(\.\d{1,7})?$/;

export function parseUsdcAmount(raw: string | number, label = "Amount"): number {
  const text = String(raw).trim();
  if (!text) throw new Error(`${label} is required.`);
  if (!USDC_PATTERN.test(text)) {
    throw new Error(`${label} must be a number with up to 7 decimal places.`);
  }
  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error(`${label} is not a valid number.`);
  if (value < USDC_MIN) throw new Error(`${label} must be at least ${USDC_MIN} USDC.`);
  if (value > USDC_MAX) throw new Error(`${label} cannot exceed ${USDC_MAX.toLocaleString()} USDC.`);
  return value;
}

export function validateCadence(raw: string): SaveCadence {
  if ((SAVE_CADENCES as string[]).includes(raw)) return raw as SaveCadence;
  throw new Error("Choose a save plan: Play, Task, Daily, Weekly, or Monthly.");
}

export function validateDeadline(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error("Pick a valid deadline date.");
  }
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Pick a valid deadline date.");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) throw new Error("Deadline cannot be in the past.");

  const max = new Date(today);
  max.setFullYear(max.getFullYear() + DEADLINE_MAX_YEARS);
  if (parsed > max) {
    throw new Error(`Deadline cannot be more than ${DEADLINE_MAX_YEARS} years from today.`);
  }
  return isoDate;
}

export function validateGoalInput(params: {
  title: string;
  description?: string;
  cadence: string;
  target: string | number;
  deadline: string;
}): {
  title: string;
  description?: string;
  cadence: SaveCadence;
  target: number;
  deadline: string;
} {
  const title = params.title.trim();
  if (!title) throw new Error("Goal title is required.");
  if (title.length > TITLE_MAX_LENGTH) {
    throw new Error(`Goal title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }

  const description = params.description?.trim() || undefined;
  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }

  return {
    title,
    description,
    cadence: validateCadence(params.cadence),
    target: parseUsdcAmount(params.target, "Target amount"),
    deadline: validateDeadline(params.deadline),
  };
}

export function validateDepositAmount(raw: string | number, remaining?: number): number {
  const amount = parseUsdcAmount(raw, "Deposit amount");
  if (remaining !== undefined && remaining >= 0 && amount > remaining + 1e-9) {
    throw new Error(`Deposit cannot exceed the remaining ${remaining.toFixed(2)} USDC on this goal.`);
  }
  return amount;
}

export function validateDisplayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    throw new Error(`Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`);
  }
  return trimmed;
}

/** Far-future date for target-only goals, still inside DEADLINE_MAX_YEARS. */
export function farFutureDeadline(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(d.getFullYear() + DEADLINE_MAX_YEARS);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
