# System Database Startup Core

## Goal

Move system-level database startup operations out of `App.vue` into a shared core database module.

## Scope

- Add `src/shared/lib/core/db.ts`.
- Update `src/App.vue` to call the shared startup functions.
- Preserve existing UI state ownership in `App.vue`.

## Main Decisions

- Keep page and overlay state out of the shared database module.
- Centralize account/currency preload, exchange-rate refresh, and due recurring-event loading.
- Keep the existing cron job in `App.vue`, but point it to the shared database refresh function.

## Checklist

- [x] Inspect current App startup database operations.
- [x] Add shared core database module.
- [x] Mount shared core functions from `App.vue`.
- [x] Run targeted verification.

## Verification Plan

- Run `npm run typecheck`.

## Final Status

Completed.

Verification:

- `npm run typecheck`: passed.
