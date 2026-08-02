# New Transaction Figma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the confirmed Figma quick-entry design to the Android-first new transaction dialog while preserving the existing transaction data flow.

**Architecture:** Keep `TransactionEditor.vue` as the feature-owned full-screen dialog. Adapt the Figma structure to Vuetify 4 and the repository theme tokens, keep calculator state local to the editor, and reuse the existing Pinia mutation flow for both save-and-close and save-and-continue.

**Tech Stack:** Vue 3.5, TypeScript, Vuetify 4.1, Pinia 3, Vue I18n, Vite 8.

---

### Task 1: Add quick-entry calculator behavior

**Files:**
- Modify: `src/modules/transactions/TransactionEditor.vue`

- [x] **Step 1: Replace the keyboard definition**

Use four fixed rows: `1 2 3 ÷`, `4 5 6 ×`, `7 8 9 −`, and `. 0 backspace +`.

- [x] **Step 2: Add local calculator state**

Track the pending operator, accumulated amount, and whether the next digit replaces the current amount. Resolve chained operations to two decimal places, allow negative intermediate results, and reject division by zero with localized feedback.

- [x] **Step 3: Route all keypad actions through one handler**

Digits and decimal input update the existing masked amount. Backspace edits the active operand. Operator presses calculate any pending operation and prepare the next operand. The transaction type remains controlled only by the segmented tabs.

- [x] **Step 4: Run the type checker**

Run: `npm run typecheck`

Expected: PASS with no Vue or TypeScript diagnostics.

### Task 2: Apply the confirmed mobile layout

**Files:**
- Modify: `src/modules/transactions/TransactionEditor.vue`

- [x] **Step 1: Rebuild the editor hierarchy**

Keep the 64 px header, 56 px transaction-type region, 206 px amount card, two-row quick-tag card, outlined note field, 4-by-4 keypad, and fixed bottom action row shown in Figma node `4:3`.

- [x] **Step 2: Preserve required business selectors**

Keep the book and date triggers in their confirmed compact positions. Hide the source-account trigger in normal entry because the existing default-account logic remains authoritative. Show a target-account trigger only for transfers, where it is required to create a valid transaction.

- [x] **Step 3: Constrain tags to two quick rows**

Display up to nine quick tags plus a More action. The tag bottom sheet remains the complete selection and creation surface so hidden or newly created tags stay reachable.

- [x] **Step 4: Add equal action buttons**

Render equal-width `Next transaction` and `Save transaction` buttons for create mode. Keep edit mode as a single save action to avoid changing edit semantics.

- [x] **Step 5: Check mobile and compact-height CSS**

Use project theme tokens and fixed touch-target heights. Keep one clear scroll boundary and reduce fixed section heights only in the existing compact-height media query.

### Task 3: Implement save-and-continue

**Files:**
- Modify: `src/modules/transactions/TransactionEditor.vue`

- [x] **Step 1: Parameterize the existing submit flow**

After a successful create, normal save emits `saved`. Save-and-continue keeps the editor open and relies on the existing store mutation to refresh transaction and account state.

- [x] **Step 2: Reset only per-entry fields**

Clear amount, note, tags, calculator state, and local errors. Preserve book, source account, transaction type, date, time, and transfer target selection.

- [x] **Step 3: Preserve edit behavior**

Editing continues to call `transactionStore.update()` and closes through the existing `saved` event.

### Task 4: Localize and document the behavior

**Files:**
- Modify: `src/i18n/messages/zh-cn.ts`
- Modify: `src/i18n/messages/en.ts`
- Modify: `docs/design/app-implementation-details.md`
- Modify: `docs/implementation logs/2026-06-09 transaction-editor-inline-keyboard-redesign.md`

- [x] **Step 1: Add localized labels and calculator errors**

Add keys for quick categories, recent usage, More, note placeholder, next transaction, save transaction, and division by zero.

- [x] **Step 2: Reconcile the design documentation**

Document the confirmed compact book/date triggers, hidden default source account, two-row quick tags, arithmetic keypad, and equal create actions.

### Task 5: Verify the implementation

**Files:**
- Verify: `src/modules/transactions/TransactionEditor.vue`

- [x] **Step 1: Run static verification**

Run: `npm run typecheck`

Expected: PASS.

- [x] **Step 2: Run the production build**

Run: `npm run build`

Expected: PASS and generate the Vite production bundle.

- [x] **Step 3: Perform browser validation**

At a 430 px mobile viewport, open `/transactions`, launch the new transaction dialog, compare the layout to Figma node `4:3`, verify all four operators, confirm `+/-` do not change transaction type, and confirm both save actions have equal dimensions.

- [x] **Step 4: Review repository compliance**

Confirm no dependency, database, public contract, global theme, or unrelated file changes were introduced. Preserve the existing untracked `docs/todo-manual.md` file.
