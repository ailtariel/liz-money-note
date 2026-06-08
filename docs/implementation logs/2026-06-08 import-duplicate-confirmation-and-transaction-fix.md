# Import Duplicate Confirmation and Transaction Fix

## Goal

Add a reusable confirmation dialog, handle duplicate imported transactions with user choice, and fix browser SQLite import failures caused by nested automatic transactions.

## Scope

- Add a shared confirmation dialog component under `src/components/common/`.
- Replace data import `window.confirm` usage with the shared dialog.
- Detect duplicates before text import writes data.
- Allow duplicate handling modes: keep all, ignore all, or cancel import.
- Disable Capacitor SQLite automatic transactions inside manually managed transactions.

## Impacted Files

- `src/components/common/ConfirmationDialog.vue`
- `src/modules/database/Data.vue`
- `src/modules/import/import.types.ts`
- `src/modules/import/import.service.ts`
- `src/modules/transactions/transaction.repository.ts`
- `src/modules/accounts/account.repository.ts`
- `src/modules/recurring/recurring.repository.ts`
- `src/modules/recurring/recurring.service.ts`
- `src/i18n/messages/en.ts`
- `src/i18n/messages/zh-cn.ts`
- `docs/design/basic-data-design.md`

## Decisions

- The requested `src/components/common/prompt.vue` does not exist in this repository. A new common confirmation component will be added instead.
- A duplicate import row is identified by book, import account, currency, type, amount, occurred time, note, and category tag name.
- Duplicate detection runs after files are read and parsed, before writing any import data.
- `keep` imports all rows. `ignore` skips duplicate rows. `abort` is handled in the page by not calling the import service.
- SQLite calls executed inside an explicit transaction pass `transaction=false` to avoid plugin-managed transaction commits.

## Checklist

- [x] Create reusable confirmation dialog component with slots.
- [x] Add duplicate import types and detection/import options.
- [x] Wire duplicate choice UI into the data import page.
- [x] Fix manual transaction write calls.
- [x] Update i18n and design documentation.
- [x] Run targeted verification.

## Verification Plan

- `npm run typecheck`
- `npm run build`
- `node --experimental-strip-types scripts/verify-import-parser.mjs`
- `node --experimental-strip-types scripts/verify-mockdata-sqlite-import.mjs`

## Verification Results

- `npm run typecheck`: passed.
- `node --experimental-strip-types scripts/verify-import-parser.mjs`: passed, `.mockdata` parsed 7 files and 1564 rows.
- `node --experimental-strip-types scripts/verify-mockdata-sqlite-import.mjs`: passed, 1564 transactions and no balance mismatches.
- `npm run build`: passed. Existing Vite warnings remain for jeep-sqlite browser `crypto` externalization and large chunks.

## Final Status

Completed.
