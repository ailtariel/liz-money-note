# Transaction Editor Inline Keyboard Redesign

## Goal

Redesign the new transaction full-screen dialog so the numeric keyboard is part of the page and the whole entry flow fits in one mobile screen.

## Scope

- Rework `TransactionEditor.vue` layout only.
- Keep existing transaction creation data flow and validation.
- Use the selected book's linked accounts and default account from the book-account association model.
- Keep book, account, date/time, and tag selection in the current transaction editor dialog.
- Remove the amount bottom sheet keyboard from this page.

## Requirements

- Numeric keyboard is inline on the page.
- Amount display uses one line.
- Book displays as a small chip.
- If the selected book has only one linked account, hide the account selector.
- Date displays as a small chip:
  - Default label is Today.
  - After selection, collapsed label is `mm-dd` when in the current year.
  - After selection, collapsed label is `yyyy-mm-dd` when outside the current year.
- Date chip opens specific date and time selection.
- All core entry elements should fit in one screen.

## Impacted Files

- `src/modules/transactions/TransactionEditor.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`

## Main Decisions

- Use a local inline keyboard in `TransactionEditor.vue` because this page needs a compact 4-column layout and submit behavior.
- Keep the shared `NumericKeyboard.vue` unchanged to avoid affecting other consumers.
- Use compact chips and native date/time inputs in a bottom sheet for the date/time picker.
- Keep account selection hidden only when the selected book has exactly one linked active account.

## Task Checklist

- [x] Replace scroll-heavy card layout with compact full-screen editor layout.
- [x] Add inline numeric keyboard with backspace and submit keys.
- [x] Add book and date chips.
- [x] Hide account selector for single linked-account books.
- [x] Keep linked-account filtering for source and target accounts.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Static review layout and state transitions:
  - Switching book resets the account to the book default account.
  - Single linked-account books hide source account selector.
  - Date label follows Today / mm-dd / yyyy-mm-dd rules.
  - Submit still uses existing transaction store creation flow.

## Final Status

Complete.

Verification:

- `npm run typecheck` passed.

## 2026-08-02 Confirmed Figma Revision

The confirmed Android quick-entry design was applied to the existing full-screen editor:

- Kept the compact book and date triggers in the header and amount card.
- Removed the normal source-account trigger while preserving the existing recent/default account resolution.
- Expanded quick tags to two rows and kept the full tag selection and creation surface under More.
- Replaced the keyboard submit/type shortcuts with four arithmetic operators: `÷`, `×`, `−`, and `+`.
- Kept all four keys as binary operators, allowed negative calculator results to continue through later operations, and left transaction direction under the selected type tab.
- Added equal-size Next transaction and Save transaction actions below the keypad.
- Next transaction uses the existing create mutation, then clears only amount, tags, note, and calculator state.
- Edit mode keeps its original single-save behavior.
