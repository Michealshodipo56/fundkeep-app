# Contract Reference

This page documents the FundKeep Soroban contract interface for developers building tooling, integrations, or keeper scripts against it directly.

**If you're building a TypeScript/JavaScript integration, use [`@fundkeep/sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) instead of hand-rolling the calls below** — it handles transaction building, simulation, signing, submission, and error decoding. See the [SDK Reference](sdk-reference.md). The raw patterns here are for the Rust/CLI side, or for understanding what the SDK does under the hood.

## Invoking Functions via Soroban CLI

```bash
# Create a goal
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $SECRET_KEY \
  --network testnet \
  -- create_goal \
  --owner $OWNER_ADDRESS \
  --token $USDC_CONTRACT_ID \
  --target_amount 15000000 \
  --deadline 1760000000

# Deposit to a goal
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $SECRET_KEY \
  --network testnet \
  -- deposit \
  --goal_id 0 \
  --amount 5000000

# Check deadline (publicly callable — no secret key required for the auth, but a fee-paying account is still needed)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $FEE_ACCOUNT_KEY \
  --network testnet \
  -- check_deadline \
  --goal_id 0

# Withdraw
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $SECRET_KEY \
  --network testnet \
  -- withdraw \
  --caller $OWNER_ADDRESS \
  --goal_id 0

# Read a goal (no signing required)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source $ANY_KEY \
  --network testnet \
  -- get_goal \
  --goal_id 0
```

## Invoking via `@fundkeep/sdk` (recommended)

```typescript
import { FundKeepClient, toStroops } from "@fundkeep/sdk";
import { signTransaction } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

const client = new FundKeepClient({
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID!,
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
});

const tx = await client.buildDepositTx({
  caller: ownerPublicKey,
  goalId: 0,
  amount: toStroops("25.5"),
});

const { hash } = await client.signAndSend(tx, signTransaction, {
  address: ownerPublicKey,
});
```

Full API in the [SDK Reference](sdk-reference.md). If you need the raw `@stellar/stellar-sdk` primitives the SDK builds on (`Contract`, `TransactionBuilder`, `rpc.Server`), read `fundkeep-sdk/src/client.ts` directly — it's a short, well-commented file.

## Error Codes

The following errors are defined in the contract's `errors.rs`. When a contract call panics with one of these codes, the transaction fails and no state is changed.

| Error Name | Description |
|---|---|
| `GoalNotFound` | The provided `goal_id` does not exist in contract storage |
| `NotUnlocked` | `withdraw` was called on a goal that is still LOCKED |
| `AlreadyWithdrawn` | `withdraw` or `deposit` was called on a goal that has already been withdrawn |
| `Unauthorized` | The caller is not the goal owner |
| `InvalidAmount` | An amount of zero or below was passed to `create_goal` or `deposit` |
| `InvalidDeadline` | The deadline timestamp is in the past at the time of `create_goal` |
