# SDK Reference

[`@fundkeep/sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) is the TypeScript client for the FundKeep contract. It builds unsigned transactions and leaves signing to the caller — in the app, that's Freighter via `@stellar/freighter-api`.

Not published to npm. Install directly from GitHub:

```bash
npm install github:Michealshodipo56/fundkeep-sdk
```

## `FundKeepClient`

```typescript
import { FundKeepClient } from "@fundkeep/sdk";
import { Networks } from "@stellar/stellar-sdk";

const client = new FundKeepClient({
  contractId: "CBYUMUNDBGT5JTYX62SSFH5NTK2ELLRT2PP3LLZOI757JB4BULDDDFAH",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
});
```

### Building transactions

Each of these returns an unsigned `Transaction`, already simulated and fee-prepared via `server.prepareTransaction` — ready to hand to a wallet for signing.

| Method | Maps to |
|---|---|
| `buildCreateGoalTx({ owner, token, targetAmount, deadline })` | `create_goal` |
| `buildDepositTx({ caller, goalId, amount })` | `deposit` |
| `buildCheckDeadlineTx({ source, goalId })` | `check_deadline` |
| `buildWithdrawTx({ caller, goalId })` | `withdraw` |

`targetAmount`, `amount`, and `deadline` are `bigint` — use `toStroops`/the raw ledger-seconds value, not JS numbers, to avoid precision loss on larger amounts.

### Reading state

```typescript
const goal = await client.getGoal(0);
// { goalId, owner, token, targetAmount, currentAmount, deadline, unlocked, withdrawn }
```

`getGoal` is read-only — it doesn't require a connected wallet or a funded account (it simulates against a well-known placeholder source account).

### Signing and submitting

```typescript
const { hash, value } = await client.signAndSend(tx, signTransaction, {
  address: ownerPublicKey,
});
```

`signTransaction` matches the shape of Freighter's (and other SEP-43 wallets') signing function exactly — pass `@stellar/freighter-api`'s `signTransaction` straight through. `signAndSend` signs, submits, and polls until the transaction lands, then decodes the return value (e.g. the new `goalId` for `create_goal`).

## Helpers

- **`toStroops(amount: number | string): bigint`** / **`fromStroops(stroops: bigint): number`** — USDC's 7-decimal conversion, parsed as a decimal string internally to avoid floating-point precision loss.
- **`deriveGoalStatus(goal): "LOCKED" | "UNLOCKED" | "WITHDRAWN"`** — derives the same three-state status used throughout the docs from a goal's `unlocked`/`withdrawn` flags.
- **`parseContractError(source): FundKeepError`** — turns an RPC error (a thrown `Error`, or a raw string) into a `FundKeepError` with a `.code` matching [the contract's named errors](../contract/functions.md) when the error is one of those; `.code` is `undefined` for anything else (network errors, timeouts, etc.), so check it before assuming the contract rejected the call.

```typescript
import { parseContractError, FundKeepErrorCode } from "@fundkeep/sdk";

try {
  await client.signAndSend(tx, signTransaction, { address });
} catch (err) {
  const parsed = parseContractError(err);
  if (parsed.code === FundKeepErrorCode.NotUnlocked) {
    // show a specific "this goal isn't unlocked yet" message
  }
}
```

## Constants

`DEFAULT_TESTNET_RPC_URL`, `DEFAULT_TESTNET_NETWORK_PASSPHRASE`, `USDC_DECIMALS` (7) are exported for convenience — none are required, `FundKeepClient` takes everything explicitly.
