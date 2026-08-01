# Account Safe Delete and Management UI Implementation Plan

> **For agentic workers:** Execute this plan inline task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace new account-archive actions with safe account deletion while preserving all historical transactions and recurring events, and improve the mobile account/book management presentation.

**Architecture:** Keep the existing `accounts.is_archived` column only for backward compatibility. A new account service owns the transactional lifecycle decision: it blocks deletion when any transaction or recurring event references the account, blocks deletion when a linked book has no active replacement, otherwise promotes a deterministic active replacement for affected defaults, removes book links, and deletes the account row in one SQLite transaction. Pinia owns mutation loading and refresh; pages own confirmation, localized feedback, and mobile presentation.

**Tech Stack:** Vue 3.5, Pinia 3, Vuetify 4.1, vue-i18n, Capacitor SQLite.

---

## Scope and Files

- Modify `src/modules/accounts/account.types.ts`: add the safe-delete result contract.
- Modify `src/modules/accounts/account.repository.ts`: add deletion-context queries, transactional row helpers, and legacy restore.
- Create `src/modules/accounts/account.service.ts`: enforce the confirmed deletion policy inside one transaction.
- Modify `src/modules/accounts/account.store.ts`: expose delete/restore actions and per-account delete loading.
- Modify `src/modules/accounts/Accounts.vue`: replace archive with confirmed delete, show localized block reasons, expose legacy restore, and improve card/editor states.
- Modify `src/modules/books/Books.vue`: improve management-card hierarchy, loading/empty states, and editor structure without changing the established book lifecycle.
- Modify `src/i18n/messages/en.ts` and `src/i18n/messages/zh-cn.ts`: add accessible labels, confirmation, success, block-reason, empty, and legacy-status text.
- Modify `docs/design/basic-data-design.md` and `docs/design/app-implementation-details.md`: record the confirmed account lifecycle and management behavior.
- Modify `docs/implementation logs/2026-08-01 project-iteration-roadmap.md` and `docs/todo.md`: close Iteration 5 and the corresponding high-priority item after verification.

## Task 1: Record the Confirmed Contract

- [x] Document that account deletion never cascades to transactions or recurring events.
- [x] Document that any historical reference blocks deletion.
- [x] Document that every linked book must have another active account before deletion; a deleted default is replaced deterministically.
- [x] Document that `is_archived` remains only for legacy rows and that legacy archived accounts can be restored.

## Task 2: Implement Transactional Safe Delete

- [x] Add `AccountDeleteResult` with `deleted: true` or a localized UI reason: `transaction_history`, `recurring_event`, or `book_replacement_required`.
- [x] Query transaction references across both `account_id` and `target_account_id`, including soft-deleted transaction rows because they remain historical records.
- [x] Query recurring-event references across both account columns.
- [x] Query every linked book and choose the first active replacement ordered by account sort order, name, then id.
- [x] Begin a SQLite transaction before checks; roll back and return a block result when a policy condition fails.
- [x] For allowed deletion, clear an affected default, promote its replacement, remove all `book_accounts` links, delete the account row, commit, and persist the Web store.
- [x] Roll back and preserve the original error if any database operation fails.

## Task 3: Store and Mobile UI

- [x] Add `deletingAccountId`, `remove`, and `restore` to the account store; refresh authoritative state after successful mutations.
- [x] Add a destructive account confirmation dialog that names the selected account and states that deletion is irreversible.
- [x] Map each block result to bilingual feedback through the global snack queue.
- [x] Keep archived legacy accounts visible with an explicit legacy chip and a restore action; do not offer new archive actions.
- [x] Disable conflicting account actions during deletion and show loading on the selected delete action.
- [x] Add loading and empty states and use Vuetify card/list/action structure for clearer one-hand mobile management.
- [x] Improve the book management cards and editor structure without changing book archive/delete semantics.

## Task 4: Verification

- [x] Run `npm run typecheck`.
- [x] Run an isolated `npm run build` using a disposable `DB_ASSET_DIR`.
- [x] Use an isolated seeded database to verify all three block reasons and a successful delete that promotes a replacement default.
- [x] Verify that blocked attempts preserve accounts, transactions, recurring events, links, defaults, and balances.
- [x] Verify in a 430 x 932 browser viewport that confirmation, loading/feedback, delete success, legacy status, restore, and updated book/account layouts are usable with no warning/error logs.
- [x] Move generated verification assets under ignored `.local` paths and stop the development server.

## Task 5: Close and Commit

- [x] Update this log with exact verification evidence and final status.
- [x] Mark Iteration 5 and the high-priority to-do complete.
- [x] Run `git diff --check` and review the staged scope without touching `docs/todo-manual.md`.
- [x] Create one independent Git commit for the completed iteration.

## Final Status

Complete.

- The final `npm run typecheck` passed.
- The final isolated production build passed with `DB_ASSET_DIR=.local/account-safe-delete-build-final` and produced no build warnings.
- A dedicated origin and seeded SQLite asset contained eight accounts, four books, one soft-deleted historical transaction, and one recurring event. The UI returned the expected `transaction_history`, `recurring_event`, and `book_replacement_required` feedback while keeping each blocked account and displayed balance unchanged.
- Deleting `Deletable Default` removed only that account, retained `Delete Replacement`, persisted across a full reload, and the `Delete Book` editor showed `Delete Replacement` as the checked linked default account.
- The legacy archived account displayed a compatibility chip with Edit disabled; Restore removed the chip, re-enabled Edit, persisted state, and showed global success feedback.
- At 430 x 932, seven account cards and four book cards stayed within the viewport with zero overflowing cards or action rows. Visual inspection confirmed the updated hierarchy, and browser warning/error logs were empty.
- The first attempted verification detected an existing `liz_money_note` IndexedDB and performed no mutations. The successful run used a separate `http://127.0.0.1:8001` origin. The development server was stopped, the viewport was reset, browser tabs were finalized, the original transport asset was copied back from a backup with matching length and timestamp, and generated public verification assets were moved under `.local/account-delete-verification/`.
