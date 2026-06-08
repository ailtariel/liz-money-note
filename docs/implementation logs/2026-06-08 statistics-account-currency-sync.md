# Statistics Account Currency Sync

## Goal

When a user selects an account on the statistics page, automatically switch the statistics target currency to that account's currency, and show a static hint explaining that statistics are converted by exchange rates.

## Scope

- Update the statistics page account filter behavior.
- Add a static exchange-rate conversion hint between the top controls and summary card.
- Add i18n text for the hint.

## Impacted Files

- `src/modules/statistics/Statistics.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`

## Decisions

- Selecting a specific account updates the page-level target currency to the account currency.
- Selecting all accounts does not reset the target currency, preserving the user's current statistics currency.
- Currency changes caused by account selection load exchange rates before recalculating statistics.
- The hint is static UI copy managed through i18n.

## Checklist

- [x] Add implementation log.
- [x] Sync statistics currency from selected account.
- [x] Add exchange-rate conversion hint.
- [x] Add i18n messages.
- [x] Run relevant verification.

## Verification Plan

- Run `npm run typecheck`.

## Final Status

Implemented.

Verification completed:

- `npm run typecheck`
