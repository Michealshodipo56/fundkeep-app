import { fetchIndexedActivityResult } from "./indexer";
import { configuredNetwork } from "./utils";

export interface TxReceipt {
  hash?: string;
  ledger?: number;
  indexed?: boolean;
}

export function stellarExpertTxUrl(hash: string): string {
  const network = configuredNetwork() === "PUBLIC" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Best-effort wait until the indexer has seen this tx. Never throws. */
export async function waitForIndexedTx(
  owner: string,
  txHash: string,
  timeoutMs = 18_000
): Promise<boolean> {
  if (!owner || !txHash) return false;
  if (!process.env.NEXT_PUBLIC_INDEXER_URL) return false;
  const started = Date.now();
  let delay = 600;
  let misses = 0;
  while (Date.now() - started < timeoutMs) {
    const { reachable, activity } = await fetchIndexedActivityResult(owner, 30);
    if (!reachable) {
      misses += 1;
      if (misses >= 2) return false;
    } else if (activity.some((entry) => entry.txHash === txHash)) {
      return true;
    }
    await sleep(delay);
    delay = Math.min(Math.round(delay * 1.4), 3_000);
  }
  return false;
}

export function receiptFromSdk(result: { hash?: string; ledger?: number } | null | undefined): TxReceipt {
  if (!result?.hash) return {};
  return { hash: result.hash, ledger: result.ledger };
}
