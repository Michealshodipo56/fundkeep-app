"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { signTransaction } from "@stellar/freighter-api";
import { toStroops, fromStroops, deriveGoalStatus } from "@fundkeep/sdk";
import { connectFreighter, checkFreighterInstalled } from "./freighter";
import { getFundKeepClient, getUsdcContractId } from "./contract";
import { fetchIndexedActivity, fetchIndexedGoals } from "./indexer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  title: string;
  category: "laptop" | "camera" | "travel" | "other";
  deadline: string; // ISO date string "YYYY-MM-DD"
  saved: number;    // USDC amount
  target: number;   // USDC amount
  status: "LOCKED" | "UNLOCKED" | "WITHDRAWN";
  createdAt: string; // ISO timestamp
}

export interface ActivityEntry {
  id: string;
  type: "deposit" | "unlock" | "withdraw" | "create";
  goalId: string;
  goalTitle: string;
  amount?: number;
  timestamp: string; // ISO timestamp
}

export interface WalletContextValue {
  // Wallet
  walletAddress: string | null;
  network: "TESTNET" | "PUBLIC";
  isConnecting: boolean;
  isDemo: boolean;
  connect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => void;
  setNetwork: (n: "TESTNET" | "PUBLIC") => void;

  // Goals
  goals: SavingsGoal[];
  createGoal: (params: {
    title: string;
    category: SavingsGoal["category"];
    target: number;
    deadline: string;
  }) => Promise<SavingsGoal>;
  depositToGoal: (goalId: string, amount: number) => Promise<void>;
  withdrawGoal: (goalId: string) => Promise<void>;
  checkDeadlines: () => Promise<void>;

  // Activity
  activity: ActivityEntry[];

  // Derived stats
  stats: {
    totalSaved: number;
    activeGoals: number;
    lockedFunds: number;
    completedGoals: number;
    overallPercent: number;
    totalTarget: number;
  };
}

// ─── Default / seed data ──────────────────────────────────────────────────────

const DEMO_ADDRESS = "GAK3X57J29PQR8LMVW7890STUVWXNEON789";

const SEED_GOALS: SavingsGoal[] = [
  {
    id: "goal-1",
    title: "Buy a New Laptop",
    category: "laptop",
    deadline: "2026-12-30",
    saved: 1250.0,
    target: 1500.0,
    status: "LOCKED",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "goal-2",
    title: "New Camera Gear",
    category: "camera",
    deadline: "2026-09-15",
    saved: 450.0,
    target: 800.0,
    status: "LOCKED",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "goal-3",
    title: "Trip to Japan",
    category: "travel",
    deadline: "2026-05-10",
    saved: 1800.0,
    target: 1800.0,
    status: "UNLOCKED",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: "act-1",
    type: "deposit",
    goalId: "goal-1",
    goalTitle: "Buy a New Laptop",
    amount: 200.0,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-2",
    type: "deposit",
    goalId: "goal-2",
    goalTitle: "New Camera Gear",
    amount: 150.0,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-3",
    type: "unlock",
    goalId: "goal-3",
    goalTitle: "Trip to Japan",
    amount: 1800.0,
    timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY_WALLET = "fk_wallet_address";
const STORAGE_KEY_NETWORK = "fk_network";
const STORAGE_KEY_GOALS = "fk_goals";
const STORAGE_KEY_ACTIVITY = "fk_activity";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── On-chain <-> local helpers ───────────────────────────────────────────────

function dateToLedgerSeconds(isoDate: string): bigint {
  return BigInt(Math.floor(new Date(isoDate).getTime() / 1000));
}

function ledgerSecondsToDate(seconds: number | bigint): string {
  return new Date(Number(seconds) * 1000).toISOString().slice(0, 10);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetworkState] = useState<"TESTNET" | "PUBLIC">("TESTNET");
  const [isConnecting, setIsConnecting] = useState(false);
  const [goals, setGoals] = useState<SavingsGoal[]>(SEED_GOALS);
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const [hydrated, setHydrated] = useState(false);

  const isDemo = walletAddress === DEMO_ADDRESS;

  // Kept in sync with the latest goals/wallet so checkDeadlines can stay a
  // stable callback (no goals/walletAddress in its deps) — otherwise its
  // identity would change every time it updates a goal, retriggering any
  // effect that depends on it and looping forever.
  const goalsRef = useRef(goals);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const walletAddressRef = useRef(walletAddress);
  useEffect(() => {
    walletAddressRef.current = walletAddress;
  }, [walletAddress]);

  // Hydrate from localStorage on mount. This intentionally renders seed data
  // first (matching the server-rendered output) and swaps in the real
  // localStorage values only after mount, to avoid a hydration mismatch —
  // the setState-in-effect lint rule doesn't have an exception for this.
  useEffect(() => {
    const storedWallet = loadFromStorage<string | null>(STORAGE_KEY_WALLET, null);
    const storedNetwork = loadFromStorage<"TESTNET" | "PUBLIC">(STORAGE_KEY_NETWORK, "TESTNET");
    const storedGoals = loadFromStorage<SavingsGoal[]>(STORAGE_KEY_GOALS, SEED_GOALS);
    const storedActivity = loadFromStorage<ActivityEntry[]>(STORAGE_KEY_ACTIVITY, SEED_ACTIVITY);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWalletAddress(storedWallet);
    setNetworkState(storedNetwork);
    setGoals(storedGoals);
    setActivity(storedActivity);
    setHydrated(true);
  }, []);

  // Persist goals
  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY_GOALS, goals);
  }, [goals, hydrated]);

  // Persist activity
  useEffect(() => {
    if (hydrated) saveToStorage(STORAGE_KEY_ACTIVITY, activity);
  }, [activity, hydrated]);

  // For a real (non-demo) connected wallet, pull authoritative goal/activity
  // history from the indexer once it's known. Falls back to whatever is
  // already in local state if the indexer isn't configured or unreachable.
  useEffect(() => {
    if (!hydrated || !walletAddress || isDemo) return;

    let cancelled = false;

    (async () => {
      const [indexedGoals, indexedActivity] = await Promise.all([
        fetchIndexedGoals(walletAddress),
        fetchIndexedActivity(walletAddress),
      ]);
      if (cancelled) return;

      if (indexedGoals.length > 0) {
        setGoals((prev) => {
          const byId = new Map(prev.map((g) => [g.id, g]));
          return indexedGoals.map((ig) => {
            const id = String(ig.goalId);
            const existing = byId.get(id);
            return {
              id,
              title: existing?.title ?? `Savings Goal #${ig.goalId}`,
              category: existing?.category ?? "other",
              deadline: existing?.deadline ?? ledgerSecondsToDate(ig.deadline),
              saved: fromStroops(BigInt(ig.currentAmount)),
              target: fromStroops(BigInt(ig.targetAmount)),
              status: ig.status,
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            } satisfies SavingsGoal;
          });
        });
      }

      if (indexedActivity.length > 0) {
        setGoals((currentGoals) => {
          const titleById = new Map(currentGoals.map((g) => [g.id, g.title]));
          setActivity(
            indexedActivity.map((ia) => ({
              id: `idx-${ia.id}`,
              type: ia.type,
              goalId: String(ia.goalId),
              goalTitle: titleById.get(String(ia.goalId)) ?? `Savings Goal #${ia.goalId}`,
              amount: ia.amount ? fromStroops(BigInt(ia.amount)) : undefined,
              timestamp: ia.createdAt,
            }))
          );
          return currentGoals;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, walletAddress, isDemo]);

  // ── Wallet actions ────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setIsConnecting(true);
    const result = await connectFreighter();

    if (result.success && result.address) {
      setWalletAddress(result.address);
      saveToStorage(STORAGE_KEY_WALLET, result.address);
      setIsConnecting(false);
      return { success: true };
    }

    // Fallback demo mode when Freighter isn't installed
    const isInstalled = await checkFreighterInstalled();
    if (!isInstalled) {
      await new Promise((r) => setTimeout(r, 700));
      setWalletAddress(DEMO_ADDRESS);
      saveToStorage(STORAGE_KEY_WALLET, DEMO_ADDRESS);
      setIsConnecting(false);
      return { success: true };
    }

    setIsConnecting(false);
    return { success: false, error: result.error };
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
  }, []);

  const setNetwork = useCallback((n: "TESTNET" | "PUBLIC") => {
    setNetworkState(n);
    saveToStorage(STORAGE_KEY_NETWORK, n);
  }, []);

  // ── Goal actions ──────────────────────────────────────────────────────────

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id">) => {
    const newEntry: ActivityEntry = { ...entry, id: `act-${Date.now()}` };
    setActivity((prev) => [newEntry, ...prev]);
  }, []);

  const createGoal = useCallback(
    async (params: {
      title: string;
      category: SavingsGoal["category"];
      target: number;
      deadline: string;
    }): Promise<SavingsGoal> => {
      const deadline =
        params.deadline || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      let id: string;

      const client = walletAddress && !isDemo ? getFundKeepClient() : null;

      if (client && walletAddress) {
        const usdc = getUsdcContractId();
        if (!usdc) {
          throw new Error("USDC token contract is not configured (NEXT_PUBLIC_USDC_CONTRACT_ID).");
        }

        const tx = await client.buildCreateGoalTx({
          owner: walletAddress,
          token: usdc,
          targetAmount: toStroops(params.target),
          deadline: dateToLedgerSeconds(deadline),
        });
        const { value: goalId } = await client.signAndSend<number>(tx, signTransaction, {
          address: walletAddress,
        });
        id = String(goalId);
      } else {
        id = `goal-${Date.now()}`;
      }

      const newGoal: SavingsGoal = {
        id,
        title: params.title,
        category: params.category,
        deadline,
        saved: 0,
        target: params.target,
        status: "LOCKED",
        createdAt: new Date().toISOString(),
      };

      setGoals((prev) => [newGoal, ...prev]);
      addActivity({
        type: "create",
        goalId: newGoal.id,
        goalTitle: newGoal.title,
        timestamp: new Date().toISOString(),
      });

      return newGoal;
    },
    [walletAddress, isDemo, addActivity]
  );

  const depositToGoal = useCallback(
    async (goalId: string, amount: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const client = walletAddress && !isDemo ? getFundKeepClient() : null;

      let newSaved = Math.min(goal.saved + amount, goal.target);
      let unlocked = newSaved >= goal.target;

      if (client && walletAddress) {
        const tx = await client.buildDepositTx({
          caller: walletAddress,
          goalId: Number(goalId),
          amount: toStroops(amount),
        });
        await client.signAndSend(tx, signTransaction, { address: walletAddress });

        const onChain = await client.getGoal(Number(goalId));
        newSaved = fromStroops(onChain.currentAmount);
        unlocked = onChain.unlocked;
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id !== goalId
            ? g
            : { ...g, saved: newSaved, status: unlocked ? "UNLOCKED" : g.status }
        )
      );

      addActivity({
        type: "deposit",
        goalId,
        goalTitle: goal.title,
        amount,
        timestamp: new Date().toISOString(),
      });

      if (unlocked && goal.status !== "UNLOCKED") {
        addActivity({
          type: "unlock",
          goalId,
          goalTitle: goal.title,
          amount: newSaved,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [goals, walletAddress, isDemo, addActivity]
  );

  const withdrawGoal = useCallback(
    async (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || goal.status !== "UNLOCKED") return;

      const client = walletAddress && !isDemo ? getFundKeepClient() : null;

      if (client && walletAddress) {
        const tx = await client.buildWithdrawTx({
          caller: walletAddress,
          goalId: Number(goalId),
        });
        await client.signAndSend(tx, signTransaction, { address: walletAddress });
      }

      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, status: "WITHDRAWN", saved: 0 } : g))
      );

      addActivity({
        type: "withdraw",
        goalId,
        goalTitle: goal.title,
        amount: goal.saved,
        timestamp: new Date().toISOString(),
      });
    },
    [goals, walletAddress, isDemo, addActivity]
  );

  const checkDeadlines = useCallback(async () => {
    const currentWalletAddress = walletAddressRef.current;
    const currentIsDemo = currentWalletAddress === DEMO_ADDRESS;
    const client = currentWalletAddress && !currentIsDemo ? getFundKeepClient() : null;
    const now = new Date();

    if (!client || !currentWalletAddress) {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.status !== "LOCKED") return g;
          return new Date(g.deadline) <= now ? { ...g, status: "UNLOCKED" } : g;
        })
      );
      return;
    }

    const overdue = goalsRef.current.filter(
      (g) => g.status === "LOCKED" && new Date(g.deadline) <= now
    );

    for (const g of overdue) {
      try {
        const tx = await client.buildCheckDeadlineTx({
          source: currentWalletAddress,
          goalId: Number(g.id),
        });
        await client.signAndSend(tx, signTransaction, { address: currentWalletAddress });

        const onChain = await client.getGoal(Number(g.id));
        const status = deriveGoalStatus(onChain);
        setGoals((prev) => prev.map((p) => (p.id === g.id ? { ...p, status } : p)));
      } catch {
        // Best-effort background check — a single failure shouldn't block
        // the rest of the goals or surface an error to the user.
      }
    }
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const activeGoals = goals.filter(
    (g) => g.status === "LOCKED" || g.status === "UNLOCKED"
  ).length;
  const lockedFunds = goals
    .filter((g) => g.status === "LOCKED")
    .reduce((sum, g) => sum + g.saved, 0);
  const completedGoals = goals.filter((g) => g.status === "WITHDRAWN").length;
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const stats = {
    totalSaved,
    activeGoals,
    lockedFunds,
    completedGoals,
    overallPercent,
    totalTarget,
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        network,
        isConnecting,
        isDemo,
        connect,
        disconnect,
        setNetwork,
        goals,
        createGoal,
        depositToGoal,
        withdrawGoal,
        checkDeadlines,
        activity,
        stats,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside <WalletProvider>");
  }
  return ctx;
}
