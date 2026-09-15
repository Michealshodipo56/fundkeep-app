import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";
import { getNetworkPassphrase } from "./contract";

/**
 * Checks if the Freighter browser extension is installed.
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const result = await isConnected();
    return !!result.isConnected;
  } catch (error) {
    console.warn("Error checking Freighter installation:", error);
    return false;
  }
}

function permissionDenied(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const rec = result as { isAllowed?: boolean; error?: string };
  if (rec.error) return String(rec.error);
  if (rec.isAllowed === false) return "Freighter access was denied.";
  return null;
}

/**
 * Connect to Freighter wallet and retrieve the user's Stellar public key.
 * Does not fall back to a demo address — callers must handle a failed connect.
 */
export async function connectFreighter(): Promise<{
  success: boolean;
  address?: string;
  error?: string;
}> {
  try {
    const installed = await checkFreighterInstalled();

    if (!installed) {
      return {
        success: false,
        error:
          "Freighter wallet extension is not installed. Install Freighter from freighter.app, then try again.",
      };
    }

    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      const permission = await setAllowed();
      const denied = permissionDenied(permission);
      if (denied) {
        return { success: false, error: denied };
      }
    }

    const network = await getNetwork();
    if (network.error) {
      return {
        success: false,
        error: `Could not determine Freighter's network: ${network.error}`,
      };
    }
    if (network.networkPassphrase !== getNetworkPassphrase()) {
      return {
        success: false,
        error:
          "Freighter is on a different Stellar network. Switch it to this FundKeep deployment's network, then try again.",
      };
    }

    const addressResult = await getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: String(addressResult.error) || "Failed to retrieve address from Freighter.",
      };
    }

    const address = addressResult.address;
    if (!address) {
      return {
        success: false,
        error: "No Stellar address returned from Freighter wallet.",
      };
    }

    return {
      success: true,
      address,
    };
  } catch (err) {
    console.error("Freighter wallet connection error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to connect to Freighter wallet.",
    };
  }
}
