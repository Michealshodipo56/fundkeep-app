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
import { connectFreighter } from "./freighter";
import { getFundKeepClient, getUsdcContractId } from "./contract";
import { fetchIndexedActivity, fetchIndexedGoals } from "./indexer";
import { fetchUsdcBalance } from "./usdc-balance";
import { configuredNetwork, type SaveCadence } from "./utils";

export type { SaveCadence };

export interface SavingsGoal {
  id: string;
  title: string;
  description?: string;
  cadence: SaveCadence;
  deadline: string;
  saved: number;
  target: number;
  status: "LOCKED" | "UNLOCKED" | "WITHDRAWN";
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  type: "deposit" | "unlock" | "withdraw" | "create";
  goalId: string;
  goalTitle: string;
  amount?: number;
  timestamp: string;
}

export interface WalletProfile {
  displayName: string;
  animations: boolean;
}

export interface WalletContextValue {
  walletAddress: string | null;
  network: "TESTNET" | "PUBLIC";
  isConnecting: boolean;
  hydrated: boolean;
  isOnChain: boolean;
  connect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => void;
  setNetwork: (n: "TESTNET" | "PUBLIC") => void;

  goals: SavingsGoal[];
  createGoal: (params: {
    title: string;
    description?: string;
    cadence: SaveCadence;
    target: number;
    deadline: string;
  }) => Promise<SavingsGoal>;
  depositToGoal: (goalId: string, amount: number) => Promise<void>;
  withdrawGoal: (goalId: string) => Promise<void>;
  checkDeadlines: () => Promise<void>;

  activity: ActivityEntry[];
  profile: WalletProfile;
  setDisplayName: (name: string) => void;
  setAnimations: (on: boolean) => void;
  usdcBalance: number | null;
  usdcBalanceLoading: boolean;
  refreshUsdcBalance: () => Promise<void>;

  stats: {
    totalSaved: number;
    activeGoals: number;
    lockedFunds: number;
    completedGoals: number;
    overallPercent: number;
    totalTarget: number;
  };
}

const STORAGE_KEY_WALLET = "fk_wallet_address";
const STORAGE_KEY_NETWORK = "fk_network";

type WalletBundle = {
  goals: SavingsGoal[];
  activity: ActivityEntry[];
  profile: WalletProfile;
};

function bundleKey(address: string) {
  return `fk_bundle_${address}`;
}

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

function isStellarPublicKey(addr: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(addr);
}

function emptyBundle(): WalletBundle {
  return { goals: [], activity: [], profile: { displayName: "", animations: true } };
}

function loadBundle(address: string): WalletBundle {
  const stored = loadFromStorage<WalletBundle | null>(bundleKey(address), null);
  if (!stored) return emptyBundle();
  return {
    goals: Array.isArray(stored.goals) ? stored.goals.map(normalizeGoal) : [],
    activity: Array.isArray(stored.activity) ? stored.activity : [],
    profile: {
      displayName: stored.profile?.displayName ?? "",
      animations: stored.profile?.animations !== false,
    },
  };
}

function normalizeGoal(raw: SavingsGoal & { category?: string }): SavingsGoal {
  const cadence: SaveCadence =
    raw.cadence === "play" ||
    raw.cadence === "task" ||
    raw.cadence === "daily" ||
    raw.cadence === "weekly" ||
    raw.cadence === "monthly"
      ? raw.cadence
      : "weekly";
  return {
    id: String(raw.id),
    title: raw.title || `Savings Goal #${raw.id}`,
    description: raw.description,
    cadence,
    deadline: raw.deadline,
    saved: Number(raw.saved) || 0,
    target: Number(raw.target) || 0,
    status: raw.status,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function dateToLedgerSeconds(isoDate: string): bigint {
  return BigInt(Math.floor(new Date(isoDate).getTime() / 1000));
}

function ledgerSecondsToDate(seconds: number | bigint): string {
  return new Date(Number(seconds) * 1000).toISOString().slice(0, 10);
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetworkState] = useState<"TESTNET" | "PUBLIC">(configuredNetwork());
  const [isConnecting, setIsConnecting] = useState(false);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [profile, setProfile] = useState<WalletProfile>({ displayName: "", animations: true });
  const [hydrated, setHydrated] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false);

  const isOnChain = !!getFundKeepClient();

  const goalsRef = useRef(goals);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const activityRef = useRef(activity);
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  const walletAddressRef = useRef(walletAddress);
  useEffect(() => {
    walletAddressRef.current = walletAddress;
  }, [walletAddress]);

  useEffect(() => {
    const storedWallet = loadFromStorage<string | null>(STORAGE_KEY_WALLET, null);
    const validWallet = storedWallet && isStellarPublicKey(storedWallet) ? storedWallet : null;

    /* Hydrate from localStorage after mount to avoid SSR mismatch. */
    /* eslint-disable react-hooks/set-state-in-effect */
    setWalletAddress(validWallet);
    setNetworkState(configuredNetwork());
    if (validWallet) {
      const bundle = loadBundle(validWallet);
      setGoals(bundle.goals);
      setActivity(bundle.activity);
      setProfile(bundle.profile);
    } else {
      setGoals([]);
      setActivity([]);
      setProfile({ displayName: "", animations: true });
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("fk-reduce-motion", profile.animations === false);
  }, [profile.animations]);

  useEffect(() => {
    if (!hydrated || !walletAddress) return;
    saveToStorage(bundleKey(walletAddress), { goals, activity, profile });
  }, [goals, activity, profile, walletAddress, hydrated]);

  const refreshUsdcBalance = useCallback(async () => {
    const address = walletAddressRef.current;
    if (!address) {
      setUsdcBalance(null);
      return;
    }
    setUsdcBalanceLoading(true);
    const balance = await fetchUsdcBalance(address);
    setUsdcBalance(balance);
    setUsdcBalanceLoading(false);
  }, []);

  useEffect(() => {
    if (!hydrated || !walletAddress) return;
    void refreshUsdcBalance();
  }, [hydrated, walletAddress, refreshUsdcBalance]);

  useEffect(() => {
    if (!hydrated || !walletAddress) return;

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
              description: existing?.description,
              cadence: existing?.cadence ?? "weekly",
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
  }, [hydrated, walletAddress]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    const result = await connectFreighter();

    if (result.success && result.address && isStellarPublicKey(result.address)) {
      const address = result.address;
      setWalletAddress(address);
      saveToStorage(STORAGE_KEY_WALLET, address);
      const bundle = loadBundle(address);
      setGoals(bundle.goals);
      setActivity(bundle.activity);
      setProfile(bundle.profile);
      setIsConnecting(false);
      return { success: true };
    }

    setIsConnecting(false);
    return {
      success: false,
      error: result.error || "Freighter did not return a valid Stellar public key.",
    };
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
    setGoals([]);
    setActivity([]);
    setProfile({ displayName: "", animations: true });
    setUsdcBalance(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
  }, []);

  const setNetwork = useCallback((n: "TESTNET" | "PUBLIC") => {
    setNetworkState(n);
    saveToStorage(STORAGE_KEY_NETWORK, n);
  }, []);

  const setDisplayName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, displayName: name.trim() }));
  }, []);

  const setAnimations = useCallback((on: boolean) => {
    setProfile((prev) => ({ ...prev, animations: on }));
  }, []);

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id">) => {
    const duplicate = activityRef.current.some(
      (a) =>
        a.type === entry.type &&
        a.goalId === entry.goalId &&
        Math.abs(new Date(a.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 15_000
    );
    if (duplicate) return;
    const newEntry: ActivityEntry = { ...entry, id: `act-${Date.now()}` };
    setActivity((prev) => [newEntry, ...prev]);
  }, []);

  const createGoal = useCallback(
    async (params: {
      title: string;
      description?: string;
      cadence: SaveCadence;
      target: number;
      deadline: string;
    }): Promise<SavingsGoal> => {
      const title = params.title.trim();
      if (!title) throw new Error("Goal title is required.");
      if (!Number.isFinite(params.target) || params.target <= 0) {
        throw new Error("Target amount must be greater than 0.");
      }
      const deadline =
        params.deadline ||
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      let id: string;
      const client = walletAddress ? getFundKeepClient() : null;

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
        title,
        description: params.description?.trim() || undefined,
        cadence: params.cadence,
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
    [walletAddress, addActivity]
  );

  const depositToGoal = useCallback(
    async (goalId: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Deposit amount must be greater than 0.");
      }
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error("Goal not found.");
      if (goal.status !== "LOCKED") throw new Error("This goal is not accepting deposits.");

      const client = walletAddress ? getFundKeepClient() : null;

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

      if (unlocked) {
        addActivity({
          type: "unlock",
          goalId,
          goalTitle: goal.title,
          amount: newSaved,
          timestamp: new Date().toISOString(),
        });
      }

      void refreshUsdcBalance();
    },
    [goals, walletAddress, addActivity, refreshUsdcBalance]
  );

  const withdrawGoal = useCallback(
    async (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error("Goal not found.");
      if (goal.status !== "UNLOCKED") throw new Error("This goal is still locked.");

      const client = walletAddress ? getFundKeepClient() : null;

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

      void refreshUsdcBalance();
    },
    [goals, walletAddress, addActivity, refreshUsdcBalance]
  );

  const checkDeadlines = useCallback(async () => {
    const currentWalletAddress = walletAddressRef.current;
    const client = currentWalletAddress ? getFundKeepClient() : null;
    const now = new Date();

    const overdue = goalsRef.current.filter(
      (g) => g.status === "LOCKED" && new Date(g.deadline) <= now
    );

    const logUnlock = (g: SavingsGoal, amount: number) => {
      addActivity({
        type: "unlock",
        goalId: g.id,
        goalTitle: g.title,
        amount,
        timestamp: new Date().toISOString(),
      });
    };

    if (!client || !currentWalletAddress) {
      if (overdue.length === 0) return;
      setGoals((prev) =>
        prev.map((g) =>
          overdue.some((u) => u.id === g.id) ? { ...g, status: "UNLOCKED" } : g
        )
      );
      for (const g of overdue) logUnlock(g, g.saved);
      return;
    }

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

        if (status === "UNLOCKED") {
          logUnlock(g, fromStroops(onChain.currentAmount));
        }
      } catch {
        // Best-effort background check
      }
    }
  }, [addActivity]);

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
        hydrated,
        isOnChain,
        connect,
        disconnect,
        setNetwork,
        goals,
        createGoal,
        depositToGoal,
        withdrawGoal,
        checkDeadlines,
        activity,
        profile,
        setDisplayName,
        setAnimations,
        usdcBalance,
        usdcBalanceLoading,
        refreshUsdcBalance,
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
