# Contract Functions

---

### `create_goal`

| Param | Type | Description |
|---|---|---|
| `owner` | `Address` | The address that will own and control this goal |
| `token` | `Address` | The SAC address of the token to be saved (USDC) |
| `target_amount` | `i128` | Amount required to auto-unlock the goal |
| `deadline` | `u64` | Ledger timestamp after which `check_deadline` can unlock the goal |

**Returns:** `u32` — the new goal's ID

**Auth:** `owner.require_auth()`

**Panics:**
- `InvalidAmount` — `target_amount` is zero or negative
- `InvalidDeadline` — `deadline` is in the past relative to the current ledger timestamp

---

### `deposit`

| Param | Type | Description |
|---|---|---|
| `goal_id` | `u32` | The ID of the goal to deposit into |
| `amount` | `i128` | Amount of token to transfer from caller to contract |

**Returns:** `()`

**Auth:** `caller.require_auth()` (caller must be the goal owner in v1)

Transfers `amount` of the goal's token from the caller to the contract. Adds `amount` to `current_amount`. If `current_amount >= target_amount` after the deposit, sets `unlocked = true` atomically in the same transaction.

**Panics:**
- `GoalNotFound` — `goal_id` does not exist
- `AlreadyWithdrawn` — the goal has already been withdrawn
- `InvalidAmount` — `amount` is zero or negative
- `Unauthorized` — caller is not the goal owner

---

### `check_deadline`

| Param | Type | Description |
|---|---|---|
| `goal_id` | `u32` | The ID of the goal to check |

**Returns:** `()`

**Auth:** None — publicly callable by any address

Reads the current ledger timestamp and compares it to `goal.deadline`. If `env.ledger().timestamp() >= goal.deadline`, sets `unlocked = true`. If the deadline has not passed, this is a no-op with no error.

**Panics:**
- `GoalNotFound` — `goal_id` does not exist
- `AlreadyWithdrawn` — the goal has already been withdrawn

---

### `withdraw`

| Param | Type | Description |
|---|---|---|
| `caller` | `Address` | Must be the goal's owner |
| `goal_id` | `u32` | The ID of the goal to withdraw from |

**Returns:** `()`

**Auth:** `caller.require_auth()` (caller must be the goal owner)

Transfers the full `current_amount` from the contract back to the goal owner. Sets `withdrawn = true`. The goal's `current_amount` field is zeroed after transfer.

**Panics:**
- `GoalNotFound` — `goal_id` does not exist
- `NotUnlocked` — `goal.unlocked` is `false`
- `AlreadyWithdrawn` — `goal.withdrawn` is already `true`
- `Unauthorized` — caller is not the goal owner

---

### `get_goal`

| Param | Type | Description |
|---|---|---|
| `goal_id` | `u32` | The ID of the goal to retrieve |

**Returns:** `SavingsGoal`

**Auth:** None — publicly readable

**Panics:**
- `GoalNotFound` — `goal_id` does not exist
