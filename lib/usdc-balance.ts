import { Horizon } from "@stellar/stellar-sdk";

function horizonUrl(): string {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type UsdcBalanceResult =
  | { ok: true; balance: number }
  | { ok: false; error: string; accountMissing?: boolean };

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function fetchUsdcBalanceOnce(address: string): Promise<UsdcBalanceResult> {
  if (!address) return { ok: false, error: "No wallet connected." };
  try {
    const server = new Horizon.Server(horizonUrl());
    const account = await withTimeout(
      server.loadAccount(address),
      8_000,
      "Timed out loading USDC balance from Horizon."
    );
    const usdc = account.balances.find((b) => "asset_code" in b && b.asset_code === "USDC");
    if (usdc && "balance" in usdc) return { ok: true, balance: parseFloat(usdc.balance) };
    return { ok: true, balance: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|404/i.test(message)) {
      return {
        ok: false,
        accountMissing: true,
        error: "This wallet is not on the network yet, so its USDC balance cannot be read.",
      };
    }
    return { ok: false, error: "Could not load USDC balance from Horizon." };
  }
}

/**
 * Reads classic USDC trustline balance from Horizon, retrying transient failures.
 */
export async function fetchUsdcBalance(
  address: string,
  attempts = 3
): Promise<UsdcBalanceResult> {
  let last: UsdcBalanceResult = { ok: false, error: "Could not load USDC balance from Horizon." };
  for (let i = 0; i < attempts; i++) {
    last = await fetchUsdcBalanceOnce(address);
    if (last.ok || last.accountMissing) return last;
    await sleep(400 * 2 ** i);
  }
  return last;
}
