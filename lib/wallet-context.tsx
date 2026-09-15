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
import {
  getFundKeepClient,
  getOnChainConfigurationError,
  getUsdcContractId,
} from "./contract";
import { fetchIndexedActivity, fetchIndexedGoals } from "./indexer";
import { fetchUsdcBalance } from "./usdc-balance";
import {
  accountExistsOnNetwork,
  explainChainError,
  fundTestnetAccount as requestFriendbot,
} from "./stellar-account";
import { receiptFromSdk, waitForIndexedTx, type TxReceipt } from "./tx";
import { validateDepositAmount, validateDisplayName, validateGoalInput } from "./validation";
import { configuredNetwork, type SaveCadence } from "./utils";

export type { SaveCadence, TxReceipt };

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
  txHash?: string;
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

  goals: SavingsGoal[];
  createGoal: (params: {
    title: string;
    description?: string;
    cadence: SaveCadence;
    target: number;
    deadline: string;
  }) => Promise<{ goal: SavingsGoal; receipt: TxReceipt }>;
  depositToGoal: (goalId: string, amount: number) => Promise<TxReceipt>;
  withdrawGoal: (goalId: string) => Promise<TxReceipt>;
  checkDeadlines: () => Promise<void>;

  activity: ActivityEntry[];
  profile: WalletProfile;
  setDisplayName: (name: string) => void;
  setAnimations: (on: boolean) => void;
  usdcBalance: number | null;
  usdcBalanceLoading: boolean;
  usdcBalanceError: string | null;
  refreshUsdcBalance: () => Promise<void>;
  lastReceipt: TxReceipt | null;
  accountFunded: boolean | null;
  fundingAccount: boolean;
  fundTestnetAccount: () => Promise<void>;

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
  const network = configuredNetwork();
  const [isConnecting, setIsConnecting] = useState(false);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [profile, setProfile] = useState<WalletProfile>({ displayName: "", animations: true });
  const [hydrated, setHydrated] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false);
  const [usdcBalanceError, setUsdcBalanceError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<TxReceipt | null>(null);
  const [accountFunded, setAccountFunded] = useState<boolean | null>(null);
  const [fundingAccount, setFundingAccount] = useState(false);

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

  const accountFundedRef = useRef(accountFunded);
  useEffect(() => {
    accountFundedRef.current = accountFunded;
  }, [accountFunded]);

  useEffect(() => {
    const storedWallet = loadFromStorage<string | null>(STORAGE_KEY_WALLET, null);
    const validWallet = storedWallet && isStellarPublicKey(storedWallet) ? storedWallet : null;

    /* Hydrate from localStorage after mount to avoid SSR mismatch. */
    /* eslint-disable react-hooks/set-state-in-effect */
    setWalletAddress(validWallet);
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
      setUsdcBalanceError(null);
      return;
    }
    setUsdcBalanceLoading(true);
    try {
      const result = await fetchUsdcBalance(address);
      if (result.ok) {
        setUsdcBalance(result.balance);
        setUsdcBalanceError(null);
      } else {
        setUsdcBalanceError(result.error);
        if (result.accountMissing) {
          setAccountFunded(false);
          setUsdcBalance(null);
        }
      }
    } finally {
      setUsdcBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !walletAddress) return;
    let cancelled = false;
    void accountExistsOnNetwork(walletAddress).then((exists) => {
      if (!cancelled) setAccountFunded(exists);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, walletAddress]);

  const fundTestnetAccount = useCallback(async () => {
    const address = walletAddressRef.current;
    if (!address) throw new Error("Connect a wallet first.");
    setFundingAccount(true);
    try {
      await requestFriendbot(address);
      setAccountFunded(true);
      void refreshUsdcBalance();
    } catch (err) {
      throw new Error(explainChainError(err));
    } finally {
      setFundingAccount(false);
    }
  }, [refreshUsdcBalance]);

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
              txHash: ia.txHash ?? undefined,
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
    setUsdcBalanceError(null);
    setLastReceipt(null);
    setAccountFunded(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
  }, []);

  const setDisplayName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, displayName: validateDisplayName(name) }));
  }, []);

  const setAnimations = useCallback((on: boolean) => {
    setProfile((prev) => ({ ...prev, animations: on }));
  }, []);

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id">) => {
    const duplicate = activityRef.current.some((a) => {
      if (entry.txHash && a.txHash && a.txHash === entry.txHash && a.type === entry.type) return true;
      return (
        a.type === entry.type &&
        a.goalId === entry.goalId &&
        Math.abs(new Date(a.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 15_000
      );
    });
    if (duplicate) return;
    const newEntry: ActivityEntry = { ...entry, id: `act-${Date.now()}` };
    setActivity((prev) => [newEntry, ...prev]);
  }, []);

  const confirmSentTx = useCallback(
    async (sent: { hash?: string; ledger?: number } | undefined): Promise<TxReceipt> => {
      const receipt = receiptFromSdk(sent);
      const owner = walletAddressRef.current;
      if (receipt.hash && owner) {
        receipt.indexed = await waitForIndexedTx(owner, receipt.hash);
      }
      setLastReceipt(receipt);
      return receipt;
    },
    []
  );

  const createGoal = useCallback(
    async (params: {
      title: string;
      description?: string;
      cadence: SaveCadence;
      target: number;
      deadline: string;
    }): Promise<{ goal: SavingsGoal; receipt: TxReceipt }> => {
      const validated = validateGoalInput(params);

      const configurationError = getOnChainConfigurationError();
      if (configurationError) throw new Error(configurationError);

      if (accountFundedRef.current === false) {
        throw new Error(explainChainError(new Error("Account not found")));
      }

      let id: string;
      let receipt: TxReceipt = {};
      const client = walletAddress ? getFundKeepClient() : null;

      if (!client || !walletAddress) {
        throw new Error("Connect a Freighter wallet before creating a savings goal.");
      }

      try {
        const usdc = getUsdcContractId();
        if (!usdc) {
          throw new Error("USDC token contract is not configured (NEXT_PUBLIC_USDC_CONTRACT_ID).");
        }

        const tx = await client.buildCreateGoalTx({
          owner: walletAddress,
          token: usdc,
          targetAmount: toStroops(validated.target),
          deadline: dateToLedgerSeconds(validated.deadline),
        });
        const sent = await client.signAndSend<number>(tx, signTransaction, {
          address: walletAddress,
        });
        if (sent.value === undefined || sent.value === null) {
          throw new Error("Goal was confirmed on Stellar but the contract did not return an id.");
        }
        receipt = await confirmSentTx(sent);
        id = String(sent.value);
      } catch (err) {
        throw new Error(explainChainError(err));
      }

      const newGoal: SavingsGoal = {
        id,
        title: validated.title,
        description: validated.description,
        cadence: validated.cadence,
        deadline: validated.deadline,
        saved: 0,
        target: validated.target,
        status: "LOCKED",
        createdAt: new Date().toISOString(),
      };

      setGoals((prev) => [newGoal, ...prev]);
      addActivity({
        type: "create",
        goalId: newGoal.id,
        goalTitle: newGoal.title,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash,
      });

      return { goal: newGoal, receipt };
    },
    [walletAddress, addActivity, confirmSentTx]
  );

  const depositToGoal = useCallback(
    async (goalId: string, amount: number): Promise<TxReceipt> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error("Goal not found.");
      if (goal.status !== "LOCKED") throw new Error("This goal is not accepting deposits.");

      const remaining = Math.max(0, goal.target - goal.saved);
      const validatedAmount = validateDepositAmount(amount, remaining);

      const configurationError = getOnChainConfigurationError();
      if (configurationError) throw new Error(configurationError);

      if (accountFundedRef.current === false) {
        throw new Error(explainChainError(new Error("Account not found")));
      }

      const client = walletAddress ? getFundKeepClient() : null;

      let newSaved: number;
      let unlocked: boolean;
      let receipt: TxReceipt = {};

      if (!client || !walletAddress) {
        throw new Error("Connect a Freighter wallet before depositing USDC.");
      }

      try {
        const tx = await client.buildDepositTx({
          caller: walletAddress,
          goalId: Number(goalId),
          amount: toStroops(validatedAmount),
        });
        const sent = await client.signAndSend(tx, signTransaction, { address: walletAddress });
        receipt = await confirmSentTx(sent);

        const onChain = await client.getGoal(Number(goalId));
        newSaved = fromStroops(onChain.currentAmount);
        unlocked = onChain.unlocked;
      } catch (err) {
        throw new Error(explainChainError(err));
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
        amount: validatedAmount,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash,
      });

      if (unlocked) {
        addActivity({
          type: "unlock",
          goalId,
          goalTitle: goal.title,
          amount: newSaved,
          timestamp: new Date().toISOString(),
          txHash: receipt.hash,
        });
      }

      void refreshUsdcBalance();
      return receipt;
    },
    [goals, walletAddress, addActivity, refreshUsdcBalance, confirmSentTx]
  );

  const withdrawGoal = useCallback(
    async (goalId: string): Promise<TxReceipt> => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error("Goal not found.");
      if (goal.status !== "UNLOCKED") throw new Error("This goal is still locked.");

      const configurationError = getOnChainConfigurationError();
      if (configurationError) throw new Error(configurationError);

      if (accountFundedRef.current === false) {
        throw new Error(explainChainError(new Error("Account not found")));
      }

      const client = walletAddress ? getFundKeepClient() : null;
      let receipt: TxReceipt = {};

      if (!client || !walletAddress) {
        throw new Error("Connect a Freighter wallet before withdrawing USDC.");
      }

      try {
        const tx = await client.buildWithdrawTx({
          caller: walletAddress,
          goalId: Number(goalId),
        });
        const sent = await client.signAndSend(tx, signTransaction, { address: walletAddress });
        receipt = await confirmSentTx(sent);
      } catch (err) {
        throw new Error(explainChainError(err));
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
        txHash: receipt.hash,
      });

      void refreshUsdcBalance();
      return receipt;
    },
    [goals, walletAddress, addActivity, refreshUsdcBalance, confirmSentTx]
  );

  const checkDeadlines = useCallback(async () => {
    if (accountFundedRef.current === false) return;

    const currentWalletAddress = walletAddressRef.current;
    const client = currentWalletAddress ? getFundKeepClient() : null;
    const now = new Date();

    const overdue = goalsRef.current.filter(
      (g) => g.status === "LOCKED" && new Date(g.deadline) <= now
    );

    const logUnlock = (g: SavingsGoal, amount: number, txHash?: string) => {
      addActivity({
        type: "unlock",
        goalId: g.id,
        goalTitle: g.title,
        amount,
        timestamp: new Date().toISOString(),
        txHash,
      });
    };

    if (!client || !currentWalletAddress) return;

    for (const g of overdue) {
      try {
        const tx = await client.buildCheckDeadlineTx({
          source: currentWalletAddress,
          goalId: Number(g.id),
        });
        const sent = await client.signAndSend(tx, signTransaction, { address: currentWalletAddress });
        const receipt = await confirmSentTx(sent);

        const onChain = await client.getGoal(Number(g.id));
        const status = deriveGoalStatus(onChain);
        setGoals((prev) => prev.map((p) => (p.id === g.id ? { ...p, status } : p)));

        if (status === "UNLOCKED") {
          logUnlock(g, fromStroops(onChain.currentAmount), receipt.hash);
        }
      } catch {
        // Best-effort background check
      }
    }
  }, [addActivity, confirmSentTx]);

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
        usdcBalanceError,
        refreshUsdcBalance,
        lastReceipt,
        accountFunded,
        fundingAccount,
        fundTestnetAccount,
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
