# Dialog Action Order Implementation Log

## Goal

Standardize popup action buttons so confirm actions are on the left and cancel actions are on the right.

## Scope

- Update the shared confirmation dialog default action order.
- Update custom confirmation dialog action slots.
- Review bottom sheet form action rows with explicit confirm and cancel buttons.
- Document the rule in repository frontend rules.

## Impacted Files

- `AI-coding-specification/front-end.md`
- `src/components/common/ConfirmationDialog.vue`
- `src/modules/database/Data.vue`
- `src/modules/books/Books.vue`
- `src/modules/accounts/Accounts.vue`
- `src/modules/tags/Tags.vue`
- `src/modules/recurring/Recurring.vue`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/transactions/Transactions.vue`

## Main Decisions

- Confirm means the primary or destructive action that applies, saves, deletes, clears, imports, or accepts the popup result.
- Cancel means closing, aborting, or dismissing without applying the popup result.
- Informational selectors without explicit confirm/cancel actions are not changed.

## Task Checklist

- [x] Update the frontend rules document.
- [x] Update the shared confirmation dialog default order.
- [x] Update custom dialog action slots.
- [x] Review bottom sheet form action rows.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Static review popup action markup from `rg`.

## Final Status

Completed. `npm run typecheck` passed.
