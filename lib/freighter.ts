import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
} from "@stellar/freighter-api";

export interface FreighterWalletState {
  isInstalled: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
}

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

/**
 * Connect to Freighter wallet and retrieve user's Stellar public key.
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
          "Freighter wallet extension is not installed. Please install Freighter from freighter.app to connect your Stellar account.",
      };
    }

    // Request access permissions from Freighter
    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      await setAllowed();
    }

    // Fetch user public key / address from Freighter
    const addressResult = await getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: addressResult.error || "Failed to retrieve address from Freighter.",
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
