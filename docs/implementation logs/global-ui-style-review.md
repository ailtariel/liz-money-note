# Global UI Style Review

**Date:** 2026-06-07

**Goal:** Review the current implementation against `docs/design/app-implementation-details.md` and list issues to address for global UI style optimization and consistency.

**Reference Documents:**

- `AI-coding-specification/coding-specification.md`
- `AI-coding-specification/app-rules.md`
- `AI-coding-specification/front-end.md`
- `docs/design/app-implementation-details.md`
- Vuetify skill for `vuetify@4.1.0`

**Reviewed Areas:**

- Vuetify theme and global defaults
- App shell, app bar, bottom navigation, and page layout
- Transactions, stats, assets, more, basic data, recurring, data, currency, exchange-rate, theme, and system pages
- Shared UI utilities and global styles

## Summary

The current implementation has the base mobile App structure in place, including bottom navigation, cards, theme tokens, and transaction-oriented pages. The main consistency gaps are not isolated to one page: typography still mixes Vuetify 3 class names with custom local font sizes, the top app bar uses a breadcrumb pattern that feels more desktop-like than mobile-native, several feature pages expose management actions directly in list rows, and the add-transaction entry does not match the required right-bottom FAB pattern.

## Issues To Address

### P0 - Align Primary Transaction Entry With App Rules

**Current implementation:** `src/modules/transactions/Transactions.vue` places the add button in the app bar actions area.

**Expected:** `docs/design/app-implementation-details.md` requires the add-transaction entry to be a right-bottom FAB, not a top menu action and not part of bottom navigation.

**Impact:** The most frequent action is less reachable for one-handed mobile use and inconsistent with the documented product priority.

**Recommended fix:** Move the transaction create entry to a floating right-bottom `v-fab` / `v-btn` pattern above the bottom navigation safe area. Keep the full-screen dialog behavior.

### P0 - Replace Legacy Vuetify Typography Classes

**Current implementation:** Multiple files still use Vuetify 3-era classes such as `text-h6`, `text-h5`, `text-h4`, `text-h3`, and `text-body-1`.

Examples:

- `src/App.vue`
- `src/components/Home.vue`
- `src/modules/auth/Login.vue`
- `src/modules/books/Books.vue`
- `src/modules/accounts/Accounts.vue`
- `src/modules/tags/Tags.vue`
- `src/modules/recurring/Recurring.vue`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/transactions/Transactions.vue`
- `src/modules/transactions/components/TransactionDetail.vue`

**Expected:** The design document requires Vuetify 4 / Material Design 3 typography names, such as `text-headline-medium`, `text-headline-small`, `text-body-large`, and `text-label-large`.

**Impact:** Typography rules are inconsistent with the current Vuetify version and make global visual tuning harder.

**Recommended fix:** Replace old class names with the documented Vuetify 4 typography classes. Where many pages use custom scoped font sizes for the same roles, consolidate them into shared classes, component defaults, or shared components.

### P1 - Rework App Bar From Breadcrumb Pattern To Mobile Page Header

**Current implementation:** `src/components/shared/app-bar.vue` renders breadcrumbs with a `Home` icon and route-derived more-page breadcrumbs.

**Expected:** The transaction page should show a simple app bar title and page-level actions. The app is Android-first and should avoid desktop-style navigation patterns.

**Impact:** The breadcrumb header makes the app feel closer to an admin/dashboard shell and consumes horizontal space on mobile.

**Recommended fix:** Replace the global breadcrumb app bar with a mobile page header pattern: current page title, optional back button for nested more pages, and a small action slot. Avoid showing `Home > More > Page` as a default mobile header.

### P1 - Normalize Card Styling And Remove Repeated Local Visual Rules

**Current implementation:** Many pages use `soft-card` plus local `*-card` classes for padding, title size, amount size, and spacing. Some components repeat `rounded="xl"` even though global defaults already define it.

Examples:

- `src/styles/main.scss`
- `src/modules/accounts/Assets.vue`
- `src/modules/accounts/Accounts.vue`
- `src/modules/books/Books.vue`
- `src/modules/tags/Tags.vue`
- `src/modules/transactions/Stats.vue`
- `src/modules/currency/Currency.vue`
- `src/modules/exchange-rate/ExchangeRateSettings.vue`

**Expected:** Cross-page visual semantics should live in theme tokens, Vuetify global defaults, Sass variables, or shared components. Pages should not repeatedly restate global card defaults.

**Impact:** Cards look similar but are controlled by scattered CSS, making global style adjustments fragile.

**Recommended fix:** Define shared mobile card/list-section patterns or tighten `VCard`, `VList`, `VListItem`, and `VAvatar` defaults. Remove repeated `rounded` props and duplicate local typography where defaults/shared classes can cover them.

### P1 - Make Basic Data Pages Less Admin-Like

**Current implementation:** `Books.vue`, `Accounts.vue`, `Tags.vue`, and `Recurring.vue` expose row-level `Edit`, `Archive`, `Delete`, or `Disable` buttons directly in list cards.

**Expected:** The App rules state that pages should not look like Excel, database, ERP, CRM, admin dashboard, or backend management UI. Low-frequency features belong under More, but should still keep a mobile app interaction model.

**Impact:** These pages visually read like CRUD management screens instead of mobile settings/detail flows.

**Recommended fix:** Make list rows the primary tap target and move secondary actions into a bottom sheet/detail sheet. Avoid showing multiple text action buttons in every row by default.

### P1 - Replace Form-Dense Bottom Sheets With Mobile Selection Flows

**Current implementation:** `Recurring.vue`, `Data.vue`, and parts of `TransactionEditor.vue` use stacked `v-select`, `v-text-field type="date"`, and dense form layouts inside bottom sheets.

**Expected:** The design document prefers list items, chips, tabs, dedicated selection sheets, Date Picker / Time Picker, and low information density. For transaction creation, account and book selection already move in the right direction, but transfer target and dates still use form controls.

**Impact:** Several workflows still feel like compact desktop forms, especially recurring events and data import.

**Recommended fix:** Convert high-friction controls to mobile-native selection surfaces: list sheets for account/book/type, chips for tags, Vuetify date/time picker flows for dates, and segmented/tab controls for modes.

### P1 - Replace Native Date/Time Inputs In Transaction Editor

**Current implementation:** `src/modules/transactions/TransactionEditor.vue` uses native `<input type="date">` and `<input type="time">`.

**Expected:** The design document calls for Date Picker / Time Picker interactions and Vuetify-date standardization using `useDate().parseISO/toISO`.

**Impact:** Native inputs have inconsistent platform styling and bypass the Vuetify interaction and theme system.

**Recommended fix:** Use Vuetify date/time components or a Vuetify-styled bottom-sheet picker flow. Convert saved values through the shared date format boundary.

### P2 - Remove Or Quarantine Skeleton / Placeholder Screens

**Current implementation:** `src/components/Home.vue`, `src/components/About.vue`, `src/modules/auth/Login.vue`, and `src/modules/auth/Dashboard.vue` still contain skeleton or placeholder UI patterns.

**Expected:** The app should present as Liz Money Note, not a generic Vue/Vite/Vuetify skeleton.

**Impact:** Even if routes are not currently exposed in the primary navigation, stale screens increase maintenance noise and can leak inconsistent style if linked later.

**Recommended fix:** Remove unused skeleton routes/components or quarantine them outside the app route surface. If any remain reachable, redesign them using the app design system and i18n.

### P2 - Replace Hardcoded Theme Swatches With Theme Tokens

**Current implementation:** Some UI elements hardcode theme-like colors, for example tag defaults and theme swatches use `#0f766e` / `#ea580c`.

Examples:

- `src/modules/theme/Theme.vue`
- `src/modules/tags/Tags.vue`
- `src/modules/transactions/TransactionEditor.vue`

**Expected:** The design document asks pages to use the actual Vuetify theme definition and avoid hardcoded page colors when tokens exist.

**Impact:** Color behavior can drift between theme variants, especially dark mode and orange theme.

**Recommended fix:** Use theme tokens for app-level visual semantics. Keep user-defined tag colors as data, but avoid using hardcoded app theme colors as local UI styling defaults where a token can express the intent.

### P2 - Standardize Page Containers And Scroll Boundaries

**Current implementation:** Pages generally use `AppBarVue` + `v-main` + `v-container`, but scrolling responsibility is mostly left to default browser flow. `Transactions.vue` uses `v-virtual-scroll` with `height: auto`, and `TransactionEditor.vue` has its own full-height card and internal scroll.

**Expected:** Layout defines fixed regions; page content defines the remaining content and scroll boundary. Multiple layers should not compete for main scrolling.

**Impact:** Mobile visual polish and bottom-navigation spacing may vary across pages, especially with long lists, full-screen dialog content, and bottom sheets.

**Recommended fix:** Introduce a consistent mobile page shell/content class or shared component that handles page padding, bottom-navigation offset, safe area, and scroll ownership.

### P2 - Normalize Bottom Sheet Headers And Actions

**Current implementation:** Bottom sheets use repeated local headers like `text-h6 font-weight-bold`, inconsistent padding, and mixed action placement.

**Expected:** Bottom sheets are a repeated cross-page pattern and should be unified through shared structure or defaults.

**Impact:** Selection sheets, detail sheets, editor sheets, and search sheets feel related but not consistently designed.

**Recommended fix:** Create or standardize a bottom-sheet section/header/action pattern. Use Vuetify 4 typography classes and consistent close/confirm placement.

## Suggested Implementation Order

- [ ] Move add-transaction entry to a right-bottom FAB and preserve the current full-screen dialog.
- [ ] Replace legacy Vuetify typography classes across reachable app pages.
- [ ] Redesign shared app bar into a mobile page header and remove breadcrumb default behavior.
- [ ] Normalize card/list-section styling through shared components, defaults, or utility classes.
- [ ] Convert row-level CRUD action buttons in low-frequency pages into row tap + bottom sheet actions.
- [ ] Replace native date/time inputs and dense select stacks in transaction/recurring flows with Vuetify mobile selection flows.
- [ ] Remove or quarantine skeleton and placeholder screens.
- [ ] Replace app-theme hardcoded swatches with theme-token-backed rendering where possible.
- [ ] Standardize page scroll boundaries and bottom sheet headers/actions.

## Verification Plan

- Run `npm run typecheck` after implementation changes.
- Run `npm run build` if shared layout, router-visible pages, Vuetify defaults, or theme config are changed.
- Manually verify mobile viewport around `430 x 932` for Transactions, New Transaction, Stats, Assets, More, Books, Accounts, Tags, Recurring, Data, Currency, Theme, and System.
- Check both `greenLight` and `greenDark`; if changing theme-token usage, also check `orangeLight` and `orangeDark`.

## Status

Review complete. No implementation changes have been made for the listed UI issues yet.
