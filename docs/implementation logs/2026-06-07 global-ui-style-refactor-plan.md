# Global UI Style Refactor Plan

**Date:** 2026-06-07

**Goal:** 根据 `docs/design/style-design-system.md` 重构全局 UI 样式系统，并把统一后的 theme token、Vuetify defaults 和全局样式应用到现有页面。

**Source Log:** This file replaces `docs/implementation logs/global-ui-style-review.md` because this work is now an implementation plan, not only a review.

## References

- `AI-coding-specification/coding-specification.md`
- `AI-coding-specification/app-rules.md`
- `AI-coding-specification/front-end.md`
- `docs/design/app-implementation-details.md`
- `docs/design/style-design-system.md`
- Vuetify skill for installed `vuetify@4.1.0`

## Scope

### In Scope

- Consolidate the current global SCSS files into one global stylesheet:
  - `src/plugins/vuetify/style.scss`
  - `src/styles/main.scss`
  - `src/styles/settings.scss`
- Reconfigure Vuetify theme tokens according to `docs/design/style-design-system.md`.
- Reconfigure Vuetify global defaults according to `docs/design/style-design-system.md`.
- Apply global token and typography usage consistently across existing routed pages.
- Remove or replace old style references that conflict with the new token system, such as old text/card-border tokens after migration.
- Keep behavior, data flow, routing, schemas, and business contracts unchanged.

### Out Of Scope

- Reworking transaction form behavior.
- Moving the add-transaction entry. The current add-transaction entry position is already correct.
- Replacing native date/time controls with Vuetify picker flows.
- Redesigning CRUD action flows for books, accounts, tags, or recurring events.
- Removing skeleton or placeholder components unless they directly block style consolidation.
- Adding new dependencies.

## Key Decisions

- `src/styles/main.scss` should become the single global SCSS entry.
- The useful responsibility of `src/styles/settings.scss` should move into `src/styles/main.scss` or Vuetify defaults/theme config.
- The useful responsibility of `src/plugins/vuetify/style.scss` should be removed unless a Vuetify Sass variable is still strictly needed. If no Sass variable remains necessary, remove the `vite-plugin-vuetify` `styles.configFile` setting.
- Theme tokens should move toward the style design system tokens: `surface-variant`, `outline`, `on-background`, `on-surface`, `on-primary`, `on-secondary`, `summary`, `income`, `expense`, `error`, and `warning`.
- Existing legacy tokens such as `text-primary`, `text-secondary`, `card-border`, `summary-text`, `chip-bg`, `chip-text`, `nav-active-bg`, and `nav-active-text` should either be mapped temporarily during migration or replaced where touched. Prefer replacing them in this refactor if the change remains mechanical.
- `style-design-system.md` is authoritative for this task, but Vuetify APIs must match installed Vuetify 4.1.0 and the Vuetify skill.

## Impacted Files / Modules

Expected implementation files:

- `vite.config.ts`
- `src/styles/main.scss`
- `src/styles/settings.scss`
- `src/plugins/vuetify/style.scss`
- `src/plugins/vuetify/vuetify.ts`
- `src/components/shared/app-bar.vue`
- `src/components/shared/bottome-nav.vue`
- `src/components/shared/AmountText.vue`
- `src/components/shared/CurrencyAutocomplete.vue`
- `src/components/shared/NumericKeyboard.vue`
- `src/modules/transactions/Transactions.vue`
- `src/modules/transactions/TransactionEditor.vue`
- `src/modules/transactions/Stats.vue`
- `src/modules/transactions/components/*.vue`
- `src/modules/accounts/*.vue`
- `src/modules/books/Books.vue`
- `src/modules/tags/Tags.vue`
- `src/modules/recurring/Recurring.vue`
- `src/modules/database/Data.vue`
- `src/modules/currency/Currency.vue`
- `src/modules/exchange-rate/ExchangeRateSettings.vue`
- `src/modules/theme/Theme.vue`
- `src/modules/system/System.vue`
- Any remaining routed placeholder pages if they still reference obsolete style classes.

Documentation files:

- `docs/design/app-implementation-details.md`
- `docs/implementation logs/global-ui-style-refactor-plan.md`

## Task Checklist

- [ ] Confirm the current style design document and app implementation document are the latest source of truth.
- [ ] Update the implementation plan before code changes.
- [ ] Consolidate global SCSS to one file.
- [ ] Remove unused Sass config file references after consolidation.
- [ ] Update Vuetify theme tokens for all four themes.
- [ ] Update Vuetify global defaults for shared component appearance.
- [ ] Replace obsolete token usage across pages and shared components.
- [ ] Replace legacy typography utility usage where it conflicts with the style design system and Vuetify 4.
- [ ] Normalize card, list, chip, muted text, amount text, and bottom navigation styling.
- [ ] Run verification.
- [ ] Update this plan status with final implementation notes.

## Verification Plan

- Run `npm run typecheck`.
- Run `npm run build` because this affects Vite/Vuetify styling configuration and many routed pages.
- Manually inspect mobile viewport around `430 x 932` for:
  - Transactions
  - New Transaction Dialog
  - Stats
  - Assets
  - More
  - Books
  - Accounts
  - Tags
  - Recurring
  - Data
  - Currency
  - Theme
  - System
- Check theme variants:
  - `greenLight`
  - `greenDark`
  - `orangeLight`
  - `orangeDark`

## Current Status

Planning only. No runtime code changes should be made until this plan is accepted or implementation is explicitly requested.
