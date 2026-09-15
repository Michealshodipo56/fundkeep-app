# Testing

## Contract Unit Tests

FundKeep's Soroban contract has a unit test suite written in Rust using `soroban-sdk`'s built-in test utilities. All tests run in a local, in-process Soroban environment — no network connection required.

Run the test suite:

```bash
cargo test
```

### What Is Covered

| Test Scenario | Expected Result |
|---|---|
| `create_goal` with valid params | Goal created, returns `goal_id = 0` on first call |
| `create_goal` with `target_amount = 0` | Panics with `InvalidAmount` |
| `create_goal` with past deadline | Panics with `InvalidDeadline` |
| `deposit` under target | `current_amount` increases, `unlocked` remains `false` |
| `deposit` that crosses target | `current_amount` increases, `unlocked` set to `true` in same call |
| `withdraw` while locked | Panics with `NotUnlocked` |
| `withdraw` after unlock by target | Succeeds, transfers full balance, sets `withdrawn = true` |
| Second `withdraw` on same goal | Panics with `AlreadyWithdrawn` |
| `check_deadline` before deadline | No-op, `unlocked` stays `false` |
| `check_deadline` after deadline | `unlocked` set to `true` |
| `withdraw` after deadline unlock | Succeeds |
| `deposit` from non-owner | Panics with `Unauthorized` |
| `withdraw` from non-owner | Panics with `Unauthorized` |

### Test Structure

Tests live in `src/test.rs`. Each test creates a fresh contract environment, registers a real Stellar Asset Contract as the test token via `soroban-sdk`'s testutils, and runs through a full or partial goal lifecycle — no hand-mocked token, so balance assertions exercise the real transfer path.

## SDK Tests

[`fundkeep-sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) has its own vitest suite (`npm test`), covering transaction-building argument encoding (mocked RPC, no network), the USDC stroops conversion helpers, and contract-error parsing.

## Indexer Tests

[`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) has its own vitest suite (`npm test`), covering event decoding, the SQLite data layer, and the poller's event-to-database application logic against a mocked RPC.

## Frontend

This repo has no automated test suite yet — `npm run lint` and `npx tsc --noEmit` are what CI runs. The wallet/chain-interaction logic itself is covered by the SDK's tests (`FundKeepClient`, which `lib/wallet-context.tsx` wraps) rather than duplicated here.

## Manual End-to-End Testing

For a full integration test against the live Soroban Testnet:

1. Deploy the contract: `fundkeep-contract/scripts/deploy.sh` (generates and funds a testnet identity, deploys, and prints a test USDC contract ID too).
2. Point `fundkeep-app/.env.local` and `fundkeep-indexer/.env` at the printed contract ID.
3. Fund your Freighter testnet account with XLM via [Friendbot](https://friendbot.stellar.org) and get some of the test USDC from whoever holds the issuer key for the token printed in step 1.
4. Run through create → deposit → withdraw in the running app, and confirm `fundkeep-indexer`'s `/api/activity/:owner` reflects each step.
