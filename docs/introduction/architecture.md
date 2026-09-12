# System Architecture

FundKeep is split across four repositories, each with a single responsibility:

| Repo | Role |
|---|---|
| [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract) | The Soroban smart contract (Rust). Source of truth for every goal's state. |
| [`fundkeep-sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) | `@fundkeep/sdk` — a TypeScript client that builds, signs, and submits contract calls. |
| [`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) | Polls the contract's events into SQLite and serves them over a small REST API. |
| `fundkeep-app` (this repo) | The Next.js frontend. |

## Topology

```
                     ┌───────────────────────┐
                     │   Freighter Wallet     │
                     │  (signs transactions)  │
                     └───────────┬───────────┘
                                 │ sign
                                 ▼
┌────────────────┐   writes   ┌─────────────────────┐   RPC calls   ┌──────────────────────┐
│      User       │ ─────────▶│   fundkeep-app        │──────────────▶│  Soroban RPC          │
│    (browser)     │           │  (Next.js frontend)   │  via          │  (Stellar Testnet)    │
└────────────────┘           └─────────┬────────────┘  @fundkeep/sdk └───────────┬──────────┘
                                        │ reads                                    │
                                        ▼                                          │ events
                              ┌──────────────────────┐                            │
                              │   fundkeep-indexer     │◀───────────────────────────┘
                              │ (polls events, serves  │      getEvents (poll)
                              │  goals/activity API)    │
                              └──────────┬─────────────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │   SQLite     │
                                  └─────────────┘
```

- **Writes** (create a goal, deposit, withdraw, check a deadline) go straight from the browser to Soroban RPC — the frontend builds the transaction via `@fundkeep/sdk`, Freighter signs it, and it's submitted directly. The indexer is never in the write path.
- **Reads** for the dashboard and activity feed come from the indexer's REST API (`/api/goals/:owner`, `/api/activity/:owner`), which mirrors on-chain state derived from the contract's events. This avoids re-deriving the full goal/activity history client-side on every page load.
- **Demo mode** (no Freighter installed) never touches the chain or the indexer — it's fully local, backed by `localStorage`, so the app is explorable without a wallet.

## Why split into four repos

Contracts, an SDK, an indexer, and a frontend are different languages, different release cadences, and different failure domains — a contract bug and a frontend styling change shouldn't ship in the same PR or the same CI pipeline. Splitting them also means each repo can be evaluated independently.

## Deployment

- **Frontend**: a platform built for it (Vercel) — static/SSR Next.js, no long-running process.
- **Indexer**: a platform suited to long-running processes with a persistent disk (Render or equivalent) — it's a stateful poller plus an HTTP server.
- **Contract**: not "deployed" in the hosting sense — it's uploaded once to the Soroban network via `fundkeep-contract/scripts/deploy.sh` and lives on-chain from then on.
