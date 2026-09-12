# Smart Contract Overview

FundKeep's on-chain logic is a single Soroban contract written in Rust using the `soroban-sdk`. One contract deployment handles all users and all goals — individual goals are differentiated by a `goal_id` integer stored in contract instance storage.

## Architecture

```
[Freighter Wallet] <--sign--> [FundKeep Frontend (Next.js + @fundkeep/sdk)]
                                          |
                                          v
                          [FundKeep Soroban Contract (Rust)]
                                          |
                                          v
                            [USDC Token Contract on Soroban]
```

The contract interacts with the USDC token contract to perform transfers. It never holds private keys — it holds USDC on behalf of users, identified by their Stellar address.

This is the contract's own view. The contract is one of four repos — see [System Architecture](../introduction/architecture.md) for how the SDK, indexer, and frontend fit around it.

## Network

FundKeep runs against **Soroban Testnet** in v1. The Soroban RPC endpoint is `https://soroban-testnet.stellar.org`. Freighter can be toggled to testnet mode in its settings.
