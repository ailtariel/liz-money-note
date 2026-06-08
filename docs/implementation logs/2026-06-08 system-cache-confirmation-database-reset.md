# System Cache Confirmation and Database Reset

## Goal

Add confirmation before clearing cache, ensure cache clearing does not delete SQLite business data, and add a confirmed database reset action for corrupted-data recovery.

## Scope

- Update the system settings page.
- Reuse the shared confirmation dialog.
- Keep cache cleanup limited to browser CacheStorage, Android WebView cache, and session runtime config.
- Add a separate database reset service path that deletes the runtime SQLite database and reinitializes it from assets.
- Add i18n copy for confirmations, warnings, success, and failure messages.

## Impacted Files

- `src/modules/system/System.vue`
- `src/modules/system/cache.service.ts`
- `src/modules/database/connection.ts`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/app-implementation-details.md`

## Decisions

- Cache cleanup remains non-destructive for SQLite business data.
- Database reset is a destructive operation and requires confirmation.
- Database reset reloads the page after successful reset so stores and route data read the new empty database.
- System item descriptions are rendered through subtitle slots with wrapping to avoid truncation.

## Checklist

- [x] Add database reset API.
- [x] Add cache confirmation.
- [x] Add database reset UI and confirmation.
- [x] Update i18n and design documentation.
- [x] Run targeted verification.

## Verification Plan

- `npm run typecheck`
- `npm run build`

## Verification Results

- `npm run typecheck`: passed.
- `npm run build`: blocked because the running Vite dev server holds `public/assets/databases/liz_money_note.db`, causing `EBUSY` when the build initializer tries to replace that asset database.

## Final Status

Completed, with build verification blocked by the active dev server file lock.
