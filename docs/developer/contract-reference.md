# Contract Reference

This page documents the FundKeep Soroban contract interface for developers building tooling, integrations, or keeper scripts against it directly.

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

## Invoking via `stellar-sdk` (JavaScript)

```typescript
import { Contract, Networks, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk";
import { SorobanRpc } from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
const contract = new Contract(process.env.NEXT_PUBLIC_CONTRACT_ID!);

// Build a deposit transaction
const account = await server.getAccount(ownerPublicKey);
const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    contract.call(
      "deposit",
      // goal_id as u32
      xdr.ScVal.scvU32(goalId),
      // amount as i128
      nativeToScVal(BigInt(amount), { type: "i128" })
    )
  )
  .setTimeout(30)
  .build();

// Simulate, then sign and send
const simResult = await server.simulateTransaction(tx);
// ... sign with Freighter and submit
```

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
