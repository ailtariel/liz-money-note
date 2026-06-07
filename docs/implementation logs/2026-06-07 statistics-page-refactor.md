# Statistics Page Refactor

## Goal

Refactor the statistics page to match the transaction page summary/filter layout, add a currency selector, and render category share plus trend charts with ECharts.

## Scope

- Update the statistics page UI and local statistics calculations.
- Reuse existing transaction filter bottom sheets where possible.
- Add a configured-currency selector that converts all statistics to one target currency.
- Replace the category share progress-only view with an ECharts pie chart and detail rows.
- Replace the trend section with an ECharts line chart.
- Remove the standalone monthly flow card.

## Impacted Files

- `src/modules/statistics/Statistics.vue`
- `src/modules/statistics/components/CategoryShareChart.vue`
- `src/modules/statistics/components/TrendLineChart.vue`
- `src/modules/statistics/useStatisticsCharts.ts`
- `src/router/index.ts`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/app-implementation-details.md`
- `docs/design/style-design-system.md`
- `package.json`
- `package-lock.json`

## Decisions

- Transaction filters remain loaded through the existing `transactionStore.load()` API.
- Currency is applied as a page-level target currency. Transactions in other currencies are converted with configured exchange rates before statistics are calculated.
- Summary balance is calculated as income minus expense for the selected currency.
- Transfer transactions are excluded from income, expense, category share, and trend totals.
- Category share uses the first tag on each expense transaction, matching the current statistics behavior.
- Transactions with missing exchange rates are not silently folded into totals; the page reports the missing source currencies.
- The initial date filter is unrestricted. The date filter sheet exposes an explicit unlimited option, and the outer chip labels this state as all periods.
- Statistics is implemented as an independent `statistics` module. It may consume transaction data, but the route page and chart presentation live outside `transactions`.
- Tag share charts use the ECharts default color palette. Pie labels are rendered inside slices to avoid unreadable external label lines.
- Missing exchange rates on the statistics page trigger an immediate online refresh for the currently needed source currencies. The warning is shown only when the refresh fails and affected transactions still cannot be converted.
- Category share now has its own expense/income mode, defaults to expense, and no longer depends on the removed transaction type or tag filter chips below the summary.
- Category share pie slices and legend dots use the same ECharts default palette index. The pie is rendered as a filled pie, with the total amount shown below the chart.
- ECharts rendering is split out of `Statistics.vue`: category share and trend charts are independent feature components, and ECharts option/palette formatting lives in a statistics module utility file.

## Checklist

- [x] Add ECharts dependency.
- [x] Add statistics page filters and summary layout.
- [x] Add ECharts pie chart for category share.
- [x] Add ECharts line chart for trend.
- [x] Split chart rendering out of the route page.
- [x] Update i18n keys.
- [x] Run relevant verification.

## Verification Plan

- Run `npm run typecheck`.
- Run a production build if typecheck passes and dependency changes need bundling verification.

## Final Status

Implemented.

Follow-up fix:

- `currencyStore.load()` now merges concurrent calls so App startup and the statistics page cannot trigger duplicate default-currency writes on the same SQLite Web connection.

Verification completed:

- `npm run typecheck`
- `npm run build`
- `npm run typecheck` after the follow-up currency load fix
- `npm run typecheck` after changing the initial statistics date range
- `npm run typecheck` after adding the unlimited date filter option
- `npm run typecheck` after moving statistics into its own module and adjusting chart labels
- `npm run typecheck` after adding automatic missing-rate refresh on the statistics page
- `npm run typecheck` after adding category share mode and removing type/tag filter chips from the statistics page
- `npm run typecheck` after extracting statistics chart components and ECharts option utilities

Build notes:

- Vite reported the existing `jeep-sqlite` browser externalization warning.
- Vite reported a chunk-size warning after ECharts was added to the statistics route.
