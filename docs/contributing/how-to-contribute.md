# How to Contribute

FundKeep is split across four repos — see [System Architecture](../introduction/architecture.md):

- [`fundkeep-contract`](https://github.com/Michealshodipo56/fundkeep-contract) — the Soroban contract (Rust)
- [`fundkeep-sdk`](https://github.com/Michealshodipo56/fundkeep-sdk) — the TypeScript client
- [`fundkeep-indexer`](https://github.com/Michealshodipo56/fundkeep-indexer) — the event indexer and REST API
- [`fundkeep-app`](https://github.com/Michealshodipo56/fundkeep-app) — the frontend and this documentation

Find the right repo for your change before opening a PR — each has its own `CONTRIBUTING.md`, `SECURITY.md`, and CI, but they all follow the same conventions below.

## Finding Something to Work On

Check each repo's Issues tab, filtered for `good first issue`:

- [fundkeep-contract issues](https://github.com/Michealshodipo56/fundkeep-contract/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [fundkeep-sdk issues](https://github.com/Michealshodipo56/fundkeep-sdk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [fundkeep-indexer issues](https://github.com/Michealshodipo56/fundkeep-indexer/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [fundkeep-app issues](https://github.com/Michealshodipo56/fundkeep-app/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

Issues are labeled by complexity (`complexity:low`/`medium`/`high`) and by which layer they touch (`contracts`, `sdk`, `indexer`, `frontend`).

A few standing ideas, already filed as issues in their respective repos:

- **Keeper endpoint** — an addition to `fundkeep-indexer` that automatically calls `check_deadline` on goals past their deadline, so owners who never reopen the app still get unlocked. See [The Deadline Unlock Pattern](../concepts/deadline-unlock.md) for context.
- **Early withdrawal with penalty** — a `fundkeep-contract` v2 feature letting an owner exit a `LOCKED` goal early, forfeiting a percentage of saved funds.
- **Group goals** — a `fundkeep-contract` v2 feature for shared goals with proportional ownership across multiple depositors.

## Branch Naming

Use one of these prefixes:

```
feat/your-feature-name
fix/what-you-are-fixing
docs/page-or-section-name
refactor/scope-of-change
test/what-is-being-tested
```

## Commit Message Format

Conventional Commits, one logical change per commit:

```
type(scope): short description in lowercase
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Pull Request Process

1. Fork the relevant repo and branch off `main` using the naming rules above.
2. Run that repo's checks before opening the PR:
   - `fundkeep-contract`: `cargo test`
   - `fundkeep-sdk` / `fundkeep-indexer`: `npm run typecheck && npm test`
   - `fundkeep-app`: `npm run lint && npx tsc --noEmit && npm run build`
3. Open a Pull Request against `main`. Reference the issue number it addresses.
4. A maintainer will review within a few days. Push follow-up changes to the same branch rather than opening a new PR.

## Documentation Changes

This documentation lives in `fundkeep-app/docs/` (this is the GitBook source). If your contribution changes how a contract function works, adds an environment variable, or adds a user-facing feature, update the relevant page here as part of the same PR — even if the code change itself is in a different repo. Docs that drift from the code are harder to fix later than docs updated alongside the change.
