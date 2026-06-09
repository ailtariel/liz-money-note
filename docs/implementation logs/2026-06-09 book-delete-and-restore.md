# Book Delete and Restore Implementation Log

## Goal

Add book deletion and archived book restore behavior on the book management page.

## Scope

- Add a destructive delete action for books with a confirmation message.
- Restore archived books by changing the archive button into a restore button.
- Keep active book archiving behavior unchanged.
- Keep all user-visible text in i18n messages.

## Impacted Files

- `src/modules/books/book.repository.ts`
- `src/modules/books/book.store.ts`
- `src/modules/books/Books.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/basic-data-design.md`

## Main Decisions

- Deleting a book is destructive. It removes the book, recurring event rules for the book, and transaction rows for the book.
- Non-deleted transactions under the book must have their account balance impact reversed before rows are removed.
- Transaction tag rows and recurring event tag rows are removed before their parent rows to satisfy existing foreign key constraints.
- Restoring an archived book only sets `books.is_archived` back to `0`.

## Task Checklist

- [x] Add repository helpers for archive restore, book transaction listing, and destructive book row cleanup.
- [x] Add a book service that performs destructive delete in one SQLite transaction.
- [x] Expose `restore` and `remove` actions from the Pinia store.
- [x] Add delete confirmation and restore/archive button switching in `Books.vue`.
- [x] Add Chinese and English i18n strings.
- [x] Update the data design document for book delete behavior.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Static check that deleting rows follows foreign key order and balance rollback only applies to non-deleted transactions.

## Final Status

Completed. `npm run typecheck` passed.
