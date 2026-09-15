import { Horizon } from "@stellar/stellar-sdk";

function horizonUrl(): string {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

/**
 * Reads the wallet's classic USDC trustline balance from Horizon.
 * Returns 0 when the account exists but has no USDC, or null if the
 * account is missing / Horizon is unreachable.
 */
export async function fetchUsdcBalance(address: string): Promise<number | null> {
  if (!address) return null;
  try {
    const server = new Horizon.Server(horizonUrl());
    const account = await server.loadAccount(address);
    const usdc = account.balances.find(
      (b) => "asset_code" in b && b.asset_code === "USDC"
    );
    if (usdc && "balance" in usdc) return parseFloat(usdc.balance);
    return 0;
  } catch {
    return null;
  }
}
