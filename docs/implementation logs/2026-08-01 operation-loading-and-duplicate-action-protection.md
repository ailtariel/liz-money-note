# Operation Loading and Duplicate-Action Protection

## Goal

Show operation-specific progress and prevent concurrent duplicate mutations for data import, data export, book deletion, and transaction save.

## Scope

- Add independent import and export loading states to the data page.
- Add target-aware book deletion state to the book store and management page.
- Add transaction mutation state to the transaction store and editor.
- Guard asynchronous handlers and store actions so repeated taps cannot start concurrent mutations.
- Preserve existing inline validation and global snack behavior.

## Impacted Files

- `src/modules/database/Data.vue`
- `src/modules/books/Books.vue`
- `src/modules/books/book.store.ts`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/transactions/transaction.store.ts`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/todo.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`

## Main Decisions

- Use separate import and export states because either operation has distinct controls and failure messages.
- Track the deleting book ID rather than a page-wide Boolean so the owning action is explicit.
- Keep transaction list loading separate from transaction mutation loading.
- Apply guards inside asynchronous handlers or store actions in addition to binding Vuetify `loading` and `disabled` props.
- Do not hide validation errors while an operation is running.

## Checklist

- [x] Map existing asynchronous paths and confirm each operation owner.
- [x] Add import and export loading states and duplicate-action guards.
- [x] Add target-aware book deletion state and duplicate-action guards.
- [x] Add transaction mutation state and duplicate-action guards.
- [x] Bind visible Vuetify loading and disabled states.
- [x] Confirm existing labels plus progress indicators are sufficient without new localized loading text.
- [x] Run `npm run typecheck`.
- [x] Run the smallest relevant production build verification.
- [x] Perform read-only browser verification of affected pages.
- [x] Update roadmap and TODO status.

## Verification Plan

- Static review of every guarded handler and store action.
- `npm run typecheck`.
- Isolated `npm run build` using a disposable database asset directory.
- Browser inspection of affected buttons and dialogs without committing destructive or import mutations.

## Final Status

Completed on 2026-08-01.

- Data operations use one mutually exclusive operation state with distinct text-import, JSON-restore, and export values.
- Duplicate-import actions remain open during processing, show the selected action's progress, and disable competing actions.
- Book deletion tracks the target book ID and blocks a second deletion at the store boundary.
- Transaction create, update, and delete share a mutation guard; the inline submit key shows an indeterminate progress indicator and cannot be tapped again while saving.
- `npm run typecheck` passed.
- The isolated production build passed with `DB_ASSET_DIR=.local/build-verification/operation-loading`.
- Read-only browser inspection confirmed the Data and Books pages render their updated controls without warnings or errors.
- Existing `jeep-sqlite` crypto externalization and Statistics chunk-size warnings remain assigned to Iteration 7.
