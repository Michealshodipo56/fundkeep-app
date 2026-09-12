# Indexer API Reference

[`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) polls the FundKeep contract's on-chain events into SQLite and serves them over a small REST API. It's the read side of the app — see [System Architecture](../introduction/architecture.md) for how it fits with the frontend and contract.

Base URL is whatever you configure as `NEXT_PUBLIC_INDEXER_URL` in the frontend — for local development, `http://localhost:4000`.

## `GET /health`

```json
{ "ok": true, "lastLedger": 4625243 }
```

`lastLedger` is the most recent ledger the indexer has processed events up through. Useful for confirming the indexer isn't stalled.

## `GET /api/goals/:owner`

Returns every goal owned by a given Stellar address, as indexed from on-chain state.

```
GET /api/goals/GAO5GK3F2XFVGUWKTFACJWRZVEGUWH47EJFLSAMLVRNP6CGV3YW2DDIK
```

```json
{
  "goals": [
    {
      "goalId": 0,
      "owner": "GAO5GK3F2XFVGUWKTFACJWRZVEGUWH47EJFLSAMLVRNP6CGV3YW2DDIK",
      "token": "CCUWRYBOQTKMKTBLBJX5ZOZ2ZGCL7Z4ODNDB53DIPI4XMB4XBONY6G6X",
      "targetAmount": "100000000",
      "currentAmount": "40000000",
      "deadline": 1800000000,
      "status": "LOCKED",
      "createdAtLedger": 4620100,
      "updatedAtLedger": 4620550
    }
  ]
}
```

`targetAmount`/`currentAmount` are decimal strings in stroops (7 decimals) — parse with `BigInt`, not `Number`, to avoid precision loss on larger amounts. `status` is derived the same way as [`deriveGoalStatus`](sdk-reference.md) in the SDK. Note this endpoint does **not** include `title` or `category` — those are off-chain, client-only metadata the indexer has no way to know (see [Savings Goals](../concepts/savings-goals.md)).

## `GET /api/activity/:owner`

Returns a chronological (newest-first) activity log for a given owner.

```
GET /api/activity/GAO5GK3F2XFVGUWKTFACJWRZVEGUWH47EJFLSAMLVRNP6CGV3YW2DDIK?limit=50
```

| Query param | Default | Notes |
|---|---|---|
| `limit` | 100 | Capped at 500 |

```json
{
  "activity": [
    {
      "id": 42,
      "goalId": 0,
      "owner": "GAO5GK3...",
      "type": "deposit",
      "amount": "10000000",
      "ledger": 4620550,
      "txHash": "a1b2c3...",
      "createdAt": "2026-09-12T10:15:00.000Z"
    }
  ]
}
```

`type` is one of `create`, `deposit`, `unlock`, `withdraw` — matching the events published in `fundkeep-contract`'s `src/events.rs`. `amount` is `null` for `create` entries.

## What it doesn't do

The indexer is read-only with respect to the chain — there's no write endpoint here, and it never holds a signing key. Writes (creating a goal, depositing, withdrawing) go directly from the frontend to Soroban RPC via `@fundkeep/sdk`.
