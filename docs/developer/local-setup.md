# Local Setup

FundKeep is split across four repos (see [System Architecture](../introduction/architecture.md)). This page covers running the frontend against a deployed contract. To also run the contract or indexer locally, see their own repos' READMEs.

## Prerequisites

- **Node.js** v20 or higher
- **[Freighter](https://freighter.app)** browser extension, set to Testnet (for signing real transactions — not required for demo mode)

## 1. Clone and Install

```bash
git clone https://github.com/Michealshodipo56/fundkeep-app.git
cd fundkeep-app
npm install
```

`npm install` also pulls `@fundkeep/sdk` directly from its GitHub repo (see `package.json`) — no separate setup step needed.

## 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

See [Environment Variables](environment-variables.md) for what each one does. **None of them are required to explore the app** — without `NEXT_PUBLIC_CONTRACT_ID` set, connecting a wallet (or skipping Freighter entirely) falls back to demo mode: seed data, fully local, no chain calls.

To use the app for real, you need a deployed contract first — see [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract)'s `scripts/deploy.sh`, which prints the exact values to put in `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_USDC_CONTRACT_ID`.

## 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. (Optional) Run the Indexer Locally

The activity feed and cross-device goal sync use [`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer). Without it, the app still works — it just falls back to `localStorage` for activity history.

```bash
git clone https://github.com/Michealshodipo56/fundkeep-indexer.git
cd fundkeep-indexer
npm install
cp .env.example .env   # set CONTRACT_ID to the same value as NEXT_PUBLIC_CONTRACT_ID
npm run dev
```

Then set `NEXT_PUBLIC_INDEXER_URL=http://localhost:4000` in `fundkeep-app/.env.local`.

## Building and Deploying the Contract

The contract lives in [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract), not this repo:

```bash
git clone https://github.com/Michealshodipo56/fundkeep-contract.git
cd fundkeep-contract
cargo test
stellar keys generate deployer --network testnet --fund
./scripts/deploy.sh deployer
```

The script builds, deploys, and prints the resulting contract ID along with the exact env vars to copy into `fundkeep-app` and `fundkeep-indexer`.
