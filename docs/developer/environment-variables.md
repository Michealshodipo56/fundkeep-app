# Environment Variables

Create a `.env.local` file in the project root (`cp .env.example .env.local`). All `NEXT_PUBLIC_` variables are exposed to the browser; never put secrets in them.

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ID` | For real (non-demo) use | The deployed FundKeep Soroban contract address | `CBYUMUNDBGT5JTYX62SSFH5NTK2ELLRT2PP3LLZOI757JB4BULDDDFAH` |
| `NEXT_PUBLIC_USDC_CONTRACT_ID` | For real (non-demo) use | The SAC (Stellar Asset Contract) address of the token being saved | See below |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | `testnet` or `mainnet` — controls which network passphrase the SDK uses | `testnet` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | No | Override the default Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_INDEXER_URL` | No | Base URL of a running [`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) instance, used for the activity feed and cross-device goal sync | `http://localhost:4000` |

None of these are required to run the app in **demo mode** (no Freighter installed, or before you've deployed a contract) — the app falls back to fully local seed data with zero network calls.

## About `NEXT_PUBLIC_USDC_CONTRACT_ID`

There is no single canonical "testnet USDC" contract to hardcode — SAC addresses depend on which issuer minted the asset. [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract)'s `scripts/deploy.sh` either verifies a known testnet USDC issuer is still live or issues a fresh test asset and wraps it as a SAC, then prints the address to use here. **Do not reuse an address you found in an old doc or example without verifying it on-chain first** — an invalid or stale address fails silently in confusing ways (transactions revert with an unrelated-looking error).

## Variables that don't exist

Earlier drafts of this doc referenced `NEXTAUTH_SECRET` / `NEXTAUTH_URL`. FundKeep does not use NextAuth or any server-side session — wallet connection is entirely client-side via Freighter. Those variables do nothing and can be ignored/removed if present in an old `.env.local`.
