# Transaction List Performance and Loading

## Goal

Reduce confirmed repeated work in the transaction list and expose correct loading feedback for initial and filtered loads.

## Scope

- Replace repeated account, book, Tag, and type-option array scans with stable computed lookup maps.
- Collapse transaction summary and date-group totals into single-pass aggregation.
- Show list loading state without briefly presenting an empty result.
- Make concurrent filter requests last-request-wins so stale results and stale loading state cannot overwrite the latest selection.
- Keep filtering, transaction persistence, and list visual structure unchanged.

## Impacted Files and Modules

- `src/modules/transactions/Transactions.vue`
- `src/modules/transactions/transaction.store.ts`
- `src/modules/transactions/useTransactionDisplay.ts`
- `src/modules/transactions/components/TransactionItem.vue`
- `src/modules/transactions/components/TransactionDetail.vue`
- `src/i18n/messages/en.ts`
- `src/i18n/messages/zh-cn.ts`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Findings and Decisions

- Each visible transaction row repeatedly used array `find` calls across accounts, books, and Tags. Icon and title resolution could also resolve the same primary Tag more than once.
- The summary scanned all transactions once for currencies and once for each income/expense type. Date rows filtered and reduced each group separately for both types.
- `transactionStore.loading` already existed but was not rendered. Initial loading therefore appeared as an empty-state card.
- Multiple filter loads can overlap. A single boolean is insufficient unless only the newest request may publish results and clear loading.
- Lookup maps remain computed from store arrays, so they rebuild only when their source collection changes and retain Vue reactivity.
- Keep the existing virtual scroll, stable row keys, and shallow transaction array replacement.

## Task Checklist

- [x] Add stable display lookup maps and shared Tag resolution.
- [x] Convert summaries and date grouping to single-pass aggregation.
- [x] Add visible list progress and correct empty-state gating.
- [x] Add last-request-wins load handling.
- [x] Run typecheck, production build, and focused UI verification.
- [x] Update roadmap and to-do status.

## Verification Plan

- Run `npm run typecheck`.
- Run `npm run build` with an isolated generated-asset target if the ignored public database remains externally locked.
- Verify initial load, empty state, filter changes, row labels, Tag chips, detail sheet, and browser console.
- Review that create/update/delete reloads still use the store's current filters.

## Final Status

Complete.

- `npm run typecheck` passed.
- `DB_ASSET_DIR=.local/transaction-list-build-verification npm run build` passed with no warnings.
- Focused browser verification confirmed three virtualized transaction rows, correct account/book/Tag labels, complete detail content, and account-filter results.
- A first navigation occurred before the detached dev server was ready and logged one transient module-fetch error. After reload, the app and all tested interactions produced no new warning or error logs.
- The generated UI-verification asset directory was moved into ignored `.local/databases-ui-verification-artifact` after testing.
