# Book Account Association Model

## Goal

Add a formal many-to-many association between books and accounts so each book has one default account and transaction entry only uses accounts linked to the selected book.

## Scope

- Add `book_accounts` as the book-account association table.
- Backfill existing local databases from historical transactions and available accounts.
- Allow the Books page editor to configure linked accounts and one default account.
- Use the selected book's default account when creating transactions and recurring events.
- Validate transaction and recurring event account selections against the selected book.
- Ensure import-created books are linked to their import account.

## Impacted Files

- `src/modules/database/schema.ts`
- `src/modules/database/migrations.ts`
- `src/modules/books/book.types.ts`
- `src/modules/books/book.repository.ts`
- `src/modules/books/book.store.ts`
- `src/modules/books/Books.vue`
- `src/modules/transactions/transaction.service.ts`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/recurring/Recurring.vue`
- `src/modules/recurring/recurring.service.ts`
- `src/modules/import/import.service.ts`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/basic-data-design.md`

## Main Decisions

- Accounts remain global assets.
- A book can link to multiple global accounts.
- A book must have at least one linked account and exactly one default account.
- Different books can link to the same account.
- Existing databases are backfilled as follows:
  - If a book has transactions, link every account used by that book's transactions and transfers.
  - The default account is the account on the latest non-deleted transaction for that book.
  - If a book has no transactions, link the first active account.
  - If there is no account, create a default cash account first.
- New books default to the first active account unless the editor selects specific linked accounts.

## Task Checklist

- [x] Add schema and migration backfill.
- [x] Add book account association repository and store APIs.
- [x] Update Books page account configuration UI.
- [x] Update transaction editor account options and defaulting.
- [x] Add transaction and recurring validation against book account links.
- [x] Update import to link import accounts to imported books.
- [x] Update related docs and i18n copy.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Static review:
  - `book_accounts` has one default account per book.
  - New and existing books receive at least one linked account.
  - Transaction creation rejects accounts outside the selected book.
  - Transaction editor only shows linked accounts for the selected book.

## Final Status

Complete.

Verification:

- `npm run typecheck` passed.
