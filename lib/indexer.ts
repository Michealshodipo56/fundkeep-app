export interface IndexerGoal {
  goalId: number;
  owner: string;
  token: string;
  targetAmount: string;
  currentAmount: string;
  deadline: number;
  status: "LOCKED" | "UNLOCKED" | "WITHDRAWN";
  createdAtLedger: number;
  updatedAtLedger: number;
}

export interface IndexerActivity {
  id: number;
  goalId: number;
  owner: string;
  type: "create" | "deposit" | "unlock" | "withdraw";
  amount: string | null;
  ledger: number;
  txHash: string | null;
  createdAt: string;
}

function baseUrl(): string | null {
  return process.env.NEXT_PUBLIC_INDEXER_URL ?? null;
}

/** Never throws — returns an empty list if the indexer isn't configured or unreachable. */
export async function fetchIndexedGoals(owner: string): Promise<IndexerGoal[]> {
  const base = baseUrl();
  if (!base) return [];

  try {
    const res = await fetch(`${base}/api/goals/${owner}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { goals?: IndexerGoal[] };
    return data.goals ?? [];
  } catch {
    return [];
  }
}

export async function fetchIndexedActivityResult(
  owner: string,
  limit = 100
): Promise<{ reachable: boolean; activity: IndexerActivity[] }> {
  const base = baseUrl();
  if (!base) return { reachable: false, activity: [] };

  try {
    const res = await fetch(`${base}/api/activity/${owner}?limit=${limit}`);
    if (!res.ok) return { reachable: false, activity: [] };
    const data = (await res.json()) as { activity?: IndexerActivity[] };
    return { reachable: true, activity: data.activity ?? [] };
  } catch {
    return { reachable: false, activity: [] };
  }
}

/** Never throws — returns an empty list if the indexer isn't configured or unreachable. */
export async function fetchIndexedActivity(
  owner: string,
  limit = 100
): Promise<IndexerActivity[]> {
  const result = await fetchIndexedActivityResult(owner, limit);
  return result.activity;
}
