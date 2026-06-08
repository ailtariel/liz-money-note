# 2026-06-08 Global Snack Queue Module

## Goal

Add a global Vuetify snack queue module for system-level messages and operation feedback.

## Scope

- Add a Pinia store under `src/modules/snack-queue/`.
- Mount `v-snackbar-queue` at the app root.
- Move system-level success/error feedback in Data and System pages to the global snack queue.
- Keep page-level content feedback in place when it represents page state or detailed results.

## Impacted Files

- `src/modules/snack-queue/snack-queue.store.ts`
- `src/App.vue`
- `src/modules/system/System.vue`
- `src/modules/database/Data.vue`

## Decisions

- Use `snack queue` naming instead of `notification`, because notification usually means user-facing persistent notifications.
- Use Vuetify `VSnackbarQueue` directly instead of a local visual wrapper.
- Use Pinia as the shared queue source so any module can push system-level feedback.
- Default success, error, warning, and info helper methods provide consistent colors and timeout values.

## Checklist

- [x] Add snack queue store.
- [x] Mount queue in `App.vue`.
- [x] Migrate system cache feedback.
- [x] Migrate data operation success/error feedback.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Static review of queue usage to ensure page-level detailed import result UI remains local.

## Final Status

Completed.

`npm run typecheck` is currently blocked by an unrelated existing unused
parameter in `src/modules/statistics/useStatisticsCharts.ts`. A secondary
typecheck with unused checks disabled passes:
`npx vue-tsc --noEmit --noUnusedLocals false --noUnusedParameters false`.
