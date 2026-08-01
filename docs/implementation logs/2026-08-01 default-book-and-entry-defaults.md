# Default Book and Transaction Entry Defaults

## Goal

Persist a user-selected default book, open the transaction page with that book, remember the last explicitly selected book, and choose a useful account for new transactions from recent valid history.

## Scope

- Add typed settings helpers for `default_book_id` and `last_opened_book_id`.
- Load and update book preferences through the book store.
- Add a set-default action and visible default state to book management.
- Initialize the transaction list with the configured active default book.
- Pass the current transaction-list book into the new-transaction editor.
- Query one recent valid linked account per candidate book instead of loading history into the component.
- Fall back to the candidate book's configured default account.
- Update the data-design document and iteration roadmap.

## Impacted Files

- `src/modules/settings/settings.repository.ts`
- `src/modules/books/book.store.ts`
- `src/modules/books/Books.vue`
- `src/modules/transactions/transaction.repository.ts`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/transactions/Transactions.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/basic-data-design.md`
- `docs/todo.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`

## Main Decisions

- Store book IDs as decimal strings in the existing `settings` table.
- Treat archived, missing, or non-positive configured IDs as unavailable without deleting historical data.
- The transaction list uses `default_book_id` only when it resolves to an active book; otherwise it keeps the existing all-books view.
- Selecting a concrete transaction-list book updates `last_opened_book_id`; selecting all books does not erase it.
- New-entry selection order is:
  1. Current list book plus its most recent valid source account.
  2. Last-opened book plus its most recent valid source account.
  3. Last-opened book plus its configured default account.
  4. Configured default book, then the first active book, as compatibility fallbacks when no last-opened book exists.
- A recent account is valid only when the transaction, account, book, and book-account link are active.

## Checklist

- [x] Add typed default-book and last-opened-book settings helpers.
- [x] Add book-store preference state and actions.
- [x] Add set-default UI and localized text.
- [x] Initialize the transaction list from the active default book.
- [x] Persist concrete book selections as last opened.
- [x] Add a repository query for the most recent valid linked account.
- [x] Apply the documented new-entry selection order.
- [x] Update the data design.
- [x] Run `npm run typecheck` and an isolated production build.
- [x] Perform browser verification in the isolated Web runtime database.
- [x] Update roadmap and TODO status.

## Verification Plan

- Static review of stale/archived setting fallbacks and account-link validity.
- `npm run typecheck`.
- Isolated `npm run build` using a disposable database asset directory.
- Browser inspection of the default-book action and transaction-page initial filter without mutating user data.

## Final Status

Completed on 2026-08-01.

- `default_book_id` and `last_opened_book_id` are persisted through typed settings helpers and validated against active books in the store.
- Book management exposes a visible default state and set-default action.
- The transaction page opens with the configured active default book and remembers later concrete book selections.
- New transactions query only the latest valid linked source account for each candidate book, then fall back to the book's configured default account.
- `npm run typecheck` passed.
- The isolated production build passed with `DB_ASSET_DIR=.local/build-verification/default-book`.
- Browser verification set a default book in the isolated Web runtime, confirmed the transaction page reopened with that filter, and confirmed the new editor used the same book without warnings or errors.
- The browser verification changed only the IndexedDB runtime for `http://127.0.0.1:8000`; source and asset databases were not modified.
