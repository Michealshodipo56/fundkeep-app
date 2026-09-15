import { Horizon } from "@stellar/stellar-sdk";
import { configuredNetwork } from "./utils";

function horizonUrl(): string {
  return configuredNetwork() === "PUBLIC"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

export function friendbotUrl(address: string): string {
  return `https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`;
}

export async function accountExistsOnNetwork(address: string): Promise<boolean | null> {
  if (!address) return null;
  try {
    const server = new Horizon.Server(horizonUrl());
    await server.loadAccount(address);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|404/i.test(message)) return false;
    return null;
  }
}

/** Creates the account on Testnet with Friendbot. No-op on mainnet. */
export async function fundTestnetAccount(address: string): Promise<void> {
  if (configuredNetwork() === "PUBLIC") {
    throw new Error("Mainnet accounts must be funded with real XLM. Friendbot only works on Testnet.");
  }

  const url = friendbotUrl(address);

  try {
    const res = await fetch(url);
    if (res.ok) return;

    const body = await res.text().catch(() => "");
    if (res.status === 400 && /already funded|op_already_exists/i.test(body)) return;

    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    throw new Error("Could not fund automatically. Finish funding in the Friendbot tab, then try again.");
  } catch (err) {
    if (err instanceof Error && /Could not fund automatically|already funded/i.test(err.message)) {
      throw err;
    }
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    throw new Error("Opened Friendbot in a new tab. After it succeeds, come back and create the goal.");
  }
}

export function explainChainError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (/account not found/i.test(raw)) {
    return configuredNetwork() === "PUBLIC"
      ? "This wallet has no Stellar account on Mainnet yet. It needs XLM before it can submit transactions."
      : "This Freighter address is not on Stellar Testnet yet. Fund it with test XLM (Friendbot), keep Freighter on Testnet, then try again.";
  }

  if (/op_underfunded|insufficient/i.test(raw)) {
    return "Not enough XLM to pay the network fee. Fund the Testnet account with Friendbot and retry.";
  }

  if (/user declined|rejected|denied/i.test(raw)) {
    return "The transaction was rejected in Freighter.";
  }

  return raw;
}
