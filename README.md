# FundKeep

Lock USDC toward a savings goal on Stellar. Funds are only withdrawable when your target is reached or your deadline passes — enforced on-chain by a Soroban smart contract, not a UI promise.

---

## What It Does

You create a savings goal with a target amount and a deadline. You deposit USDC into it. The contract holds the funds and blocks withdrawal until one of two things happens:

- Your cumulative deposits reach the target → goal unlocks automatically in the same transaction
- The deadline passes and `check_deadline` is called → goal unlocks

Once unlocked, you call `withdraw` and receive the full balance back to your wallet in a single transaction.

There is no penalty, no yield, no custodian. The lock is enforced by the contract.

---

## Architecture

FundKeep is split across four repos:

| Repo | Role |
|---|---|
| [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract) | The Soroban smart contract (Rust) — source of truth for goal state |
| [`fundkeep-sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) | `@fundkeep/sdk` — TypeScript client that builds/signs/submits contract calls |
| [`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) | Indexes contract events into SQLite, serves the dashboard/activity feed |
| `fundkeep-app` (this repo) | The Next.js frontend |

The frontend writes to the chain directly via RPC (through `@fundkeep/sdk`, signed by Freighter) and reads goal/activity history from the indexer's REST API.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Wallet | Freighter (`@stellar/freighter-api`) |
| Chain client | `@fundkeep/sdk` (`@stellar/stellar-sdk` under the hood) |
| Animation | Framer Motion |
| Network | Stellar Testnet |

---

## Getting Started

### Prerequisites

- Node.js v20+
- [Freighter](https://freighter.app) browser extension set to **Testnet**

### Install and Run

```bash
git clone https://github.com/Michealshodipo56/fundkeep-app.git
cd fundkeep-app
npm install
cp .env.example .env.local  # fill in contract IDs — see Environment Variables below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app loads with seed data in demo mode so you can explore the UI without a wallet connection — no env vars required for that. Real on-chain use requires `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_USDC_CONTRACT_ID` to be set, which means deploying the contract first — see [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract).

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. At minimum, real (non-demo) usage needs `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_USDC_CONTRACT_ID`. `NEXT_PUBLIC_INDEXER_URL` is optional — without it, the activity feed and cross-device goal sync fall back to local-only storage.

---

## Contract

The Soroban contract exposes five functions — see [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract) for the full spec, source, and tests:

| Function | Auth | Description |
|---|---|---|
| `create_goal(owner, token, target_amount, deadline)` | owner | Creates a new savings goal, returns `goal_id` |
| `deposit(caller, goal_id, amount)` | caller (must be owner) | Deposits USDC; auto-unlocks if target is reached |
| `check_deadline(goal_id)` | none (public) | Unlocks goal if deadline has passed |
| `withdraw(caller, goal_id)` | caller (must be owner) | Transfers full balance back to owner |
| `get_goal(goal_id)` | none (public) | Returns the full goal struct |

Soroban contracts have no internal timer. `check_deadline` must be called by an external transaction after the deadline passes — the FundKeep frontend does this automatically for the connected owner's overdue goals.

---

## Testing

```bash
npm run lint
```

Contract tests live in `fundkeep-contract` (`cargo test`); SDK and indexer tests live in their own repos (`npm test`).

---

## Project Structure

```
fundkeep-app/
├── app/                  # Next.js app router pages
│   ├── dashboard/        # Goal dashboard
│   ├── goals/            # Goal detail view
│   ├── deposit/          # Deposit flow
│   ├── activity/         # Activity feed
│   └── settings/         # User settings
├── components/           # Shared UI components
├── lib/
│   ├── wallet-context.tsx # WalletProvider — goal state, deposits, withdrawals
│   ├── contract.ts        # FundKeepClient singleton (@fundkeep/sdk)
│   ├── indexer.ts         # Fetch helpers for the indexer's REST API
│   └── freighter.ts       # Freighter connection helpers
├── docs/                 # Full GitBook documentation source
└── public/               # Static assets
```

---

## Contributing

Check [open issues](https://github.com/Michealshodipo56/fundkeep-app/issues) for work labelled `good first issue`. A keeper script that auto-calls `check_deadline` on overdue goals is the most-wanted first contribution.

Branch naming: `feat/`, `fix/`, `docs/`, `test/`  
Commit format: `type(scope): description` (Conventional Commits)

Full contributing guide: [`docs/contributing/how-to-contribute.md`](docs/contributing/how-to-contribute.md)
