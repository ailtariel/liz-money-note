# Project Iteration Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use an executing-plans equivalent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current mixed TODO list into a verified delivery roadmap and iteratively complete the highest-value product and reliability gaps.

**Architecture:** Preserve the existing Vue feature-module boundaries and SQLite service/repository layering. Each iteration must deliver one independently verifiable behavior slice, update this roadmap and `docs/todo.md`, and avoid unrelated refactors or schema changes unless the iteration explicitly requires them.

**Tech Stack:** Vue 3.5, Pinia 3, Vuetify 4.1, TypeScript 6, Vite 8, Capacitor 8, SQLite.

---

## Current Baseline

The core local-first MVP is implemented: books, accounts, tags, transactions, recurring events, statistics, import/export, Android packaging, update checks, and book-account associations exist.

The previous TODO list mixed four different states:

- Confirmed open work.
- Partially implemented work.
- Completed work that was not moved to the done section.
- Historical implementation-plan checkboxes that were not backfilled.

This roadmap uses the implementation and Git history as the status source. `docs/todo.md` remains the concise product queue.

## Delivery Order

### Active Correction: Database Asset Bootstrap

**Goal:** Restore first-launch asset import before migrations and keep the generated asset directory limited to one configured database.

**Implementation log:** `docs/implementation logs/2026-08-01 database-asset-bootstrap-correction.md`

**Status:** Completed on 2026-08-01. First-launch Web import, isolated production generation, and Android synchronized assets were verified.

### Iteration 1: Restore Transaction Editing

**Goal:** Make the transaction detail Edit action open a populated editor and persist balance-safe changes.

**Files:**

- Modify: `src/modules/transactions/transaction.repository.ts`
- Modify: `src/modules/transactions/transaction.service.ts`
- Modify: `src/modules/transactions/transaction.store.ts`
- Modify: `src/modules/transactions/components/TransactionDetail.vue`
- Modify: `src/modules/transactions/TransactionEditor.vue`
- Modify: `src/modules/transactions/Transactions.vue`
- Modify: `src/i18n/messages/zh-cn.ts`
- Modify: `src/i18n/messages/en.ts`
- Modify: `docs/todo.md`

**Root cause:** `TransactionDetail.vue` renders an Edit button without an event handler. `TransactionEditor.vue` only initializes a new transaction and calls `transactionStore.create()`. No repository, service, or store update operation exists.

**Update contract:**

```ts
export async function updateTransaction(id: number, input: TransactionInput) {
  // Validate the new input, reverse the old balance impact, replace editable
  // transaction fields and tags, apply the new balance impact, then commit.
}
```

**Repository mutation:**

```sql
UPDATE transactions
SET book_id = ?, type = ?, amount = ?, currency = ?,
    account_id = ?, target_account_id = ?, occurred_at = ?,
    note = ?, updated_at = ?
WHERE id = ? AND deleted_at IS NULL;
```

The existing `recurring_event_id`, `created_at`, and `deleted_at` values remain unchanged. Tag rows are replaced inside the same SQLite transaction.

**Checklist:**

- [x] Add repository functions to update editable transaction fields and replace transaction Tag links.
- [x] Add a service update transaction that validates the new input and preserves account-balance consistency in one SQLite transaction.
- [x] Add a Pinia update action that refreshes transaction and account state after persistence.
- [x] Emit an Edit action from the detail sheet and open the full-screen editor with the selected transaction.
- [x] Populate the editor from an existing transaction and switch submit behavior between create and update.
- [x] Add Chinese and English edit-title text.
- [x] Run `npm run typecheck`.
- [x] Run an isolated `npm run build` while the development asset is in use.
- [x] Verify the detail Edit action opens a populated editor without mutating data.
- [x] Update this iteration's final status and `docs/todo.md`.

**Status:** Completed on 2026-08-01. Repository, service, store, and UI update paths are implemented; typecheck, isolated build, and read-only browser verification passed.

### Iteration 2: Operation Loading and Duplicate-Action Protection

**Goal:** Provide visible progress and prevent duplicate submission for import, export, book deletion, and transaction save.

**Files:**

- Modify: `src/modules/database/Data.vue`
- Modify: `src/modules/books/Books.vue`
- Modify: `src/modules/books/book.store.ts`
- Modify: `src/modules/transactions/TransactionEditor.vue`
- Modify: `src/modules/transactions/transaction.store.ts`
- Modify: `src/i18n/messages/zh-cn.ts`
- Modify: `src/i18n/messages/en.ts`

**Checklist:**

- [x] Map each asynchronous operation to one owning loading state.
- [x] Bind visible loading and disabled states to destructive and submit actions.
- [x] Keep local validation errors visible and preserve global snack behavior.
- [x] Verify repeated taps cannot start concurrent mutations.
- [x] Run `npm run typecheck` and the smallest relevant build verification.

**Status:** Completed on 2026-08-01. Import, restore, export, book deletion, and transaction mutation paths now expose progress and enforce function/store-level concurrency guards.

### Iteration 3: Default Book and Transaction Entry Defaults

**Goal:** Open the transaction page with the configured default book and choose a useful account using verified recent transaction history.

**Files:**

- Modify: `src/modules/settings/settings.repository.ts`
- Modify: `src/modules/books/book.store.ts`
- Modify: `src/modules/books/Books.vue`
- Modify: `src/modules/transactions/transaction.repository.ts`
- Modify: `src/modules/transactions/TransactionEditor.vue`
- Modify: `src/modules/transactions/Transactions.vue`
- Modify: `src/i18n/messages/zh-cn.ts`
- Modify: `src/i18n/messages/en.ts`
- Modify: `docs/design/basic-data-design.md`

**Selection order:**

1. Current book plus that book's most recent transaction account.
2. Last-used book plus that book's most recent transaction account.
3. Last-used book plus that book's configured default account.

**Checklist:**

- [x] Persist and load the default-book setting through the existing `settings` table.
- [x] Add a default-book action to book management.
- [x] Default the transaction list filter to the configured active book.
- [x] Query the most recent valid linked account without loading unrelated history into the component.
- [x] Fall back to the selected book's configured default account.
- [x] Update the data-design document and run verification.

**Status:** Completed on 2026-08-01. Default and last-opened books are persisted, the transaction page honors the active default, and new entries use recent valid account history with a default-account fallback.

### Iteration 4: Android and Update UX Reliability

**Goal:** Diagnose the missing launcher icon on an installed APK and add a non-intrusive startup update prompt.

**Checklist:**

- [ ] Reproduce the launcher-icon issue on a clean install and record device/launcher behavior. Blocked until the affected device or equivalent launcher is connected.
- [x] Verify Android manifest launcher activity, adaptive-icon XML, density assets, and generated APK contents before changing resources.
- [x] Add an application-level update prompt only when a newer release is available.
- [x] Reuse the existing update store and Android installer path.
- [ ] Verify release APK behavior on a device; local debug assembly and APK packaging inspection passed.

**Status:** Partially completed on 2026-08-01. Startup update UX is complete and verified. The APK launcher contract is valid, a debug APK is available, and a follow-up `adb devices -l` check returned no connected devices; this workstation also has no Android Emulator installation or configured SDK root. Clean-install behavior therefore remains a device/launcher verification gap, so no speculative icon change was made.

### Iteration 5: Account Lifecycle Decision and Implementation

**Goal:** Replace account archiving only after the destructive behavior for referenced historical transactions is confirmed.

**Decision gate:** Account deletion affects historical transaction display, book-account links, recurring rules, and balance reconstruction. Confirm whether deletion should be blocked for referenced accounts, soft-delete the account, or cascade through history before implementation.

**Checklist:**

- [ ] Record the confirmed account deletion policy in `docs/design/basic-data-design.md`.
- [ ] Create a dedicated implementation log for the selected policy.
- [ ] Implement repository/service/store/UI changes in one iteration.
- [ ] Verify historical transaction and balance invariants.

### Iteration 6: Data Entry Quality

**Goal:** Improve common entry workflows without changing the core transaction contract.

**Checklist:**

- [x] Add a reusable Tag color palette and deterministic color rotation for initialization, manual creation, and text import.
- [x] Add currency conversion guidance where automatic conversion is shown. Completed in `2026-06-08 statistics-account-currency-sync.md`.
- [x] Move the add-transaction entry to a bottom-center page action while keeping it outside bottom navigation.
- [ ] Add configurable transaction-success sound only after storage and Android audio behavior are specified.

### Iteration 7: Engineering Cleanup

**Goal:** Remove verified build warnings and finish transaction-list performance/loading work.

**Checklist:**

- [x] Capture the exact `jeep-sqlite` crypto externalization warning and confirm whether it affects the Web or Android bundle.
- [x] Capture the ECharts chunk warning and measure the current production chunk split before changing Vite configuration.
- [x] Profile repeated transaction-row computations and move only confirmed hot lookups to stable maps.
- [x] Add list loading feedback using the existing transaction store state.
- [x] Replace the skeleton README with project-specific setup, data, build, and release documentation.
- [x] Backfill or archive historical plans whose checkbox state conflicts with their final status.

### Iteration 8: Optional Product Features

These items remain independent and should receive separate implementation logs before code changes:

- Merge books with explicit balance and history rules.
- Create transactions from clipboard text with an explicit parsing contract.
- Export and restore a raw SQLite `.db` file if JSON backup is insufficient.

## Verification Policy

- Run static reasoning and `npm run typecheck` for every iteration.
- Run `npm run build` for shared data, configuration, or bundling changes.
- Run Android Gradle assembly for Android resource, installer, or native plugin changes.
- Use manual mobile interaction verification for dialog, sheet, keyboard, loading, and launcher behavior.
- Record unrelated failures without expanding an iteration to fix them.

## Final Status

In progress. The database correction and Iterations 1-3 are complete. Iteration 4 update UX is complete, while launcher reproduction is waiting for a device. Iteration 6 tag colors, currency guidance, and bottom-center transaction action are complete; configurable success sound remains gated by a product and Android audio contract. Iteration 7 engineering cleanup is complete.
