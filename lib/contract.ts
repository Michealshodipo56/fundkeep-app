import { Networks } from "@stellar/stellar-sdk";
import { FundKeepClient } from "@fundkeep/sdk";

let cachedClient: FundKeepClient | null | undefined;

/**
 * Returns a singleton FundKeepClient built from env vars, or null if the
 * contract hasn't been configured yet (e.g. local dev before deployment).
 * Callers should treat null as "not ready" and fall back gracefully rather
 * than crashing the page.
 */
export function getFundKeepClient(): FundKeepClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
    "https://soroban-testnet.stellar.org";

  if (!contractId) {
    cachedClient = null;
    return cachedClient;
  }

  const networkPassphrase =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
      ? Networks.PUBLIC
      : Networks.TESTNET;

  cachedClient = new FundKeepClient({
    contractId,
    rpcUrl,
    networkPassphrase,
    allowHttp: rpcUrl.startsWith("http://"),
  });

  return cachedClient;
}

export function getUsdcContractId(): string | null {
  return process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ?? null;
}
