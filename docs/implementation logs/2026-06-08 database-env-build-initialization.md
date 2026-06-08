# Database Env Build Initialization

## Goal

Use environment-driven SQLite database configuration, keep local development backed by a generated SQLite asset database path from `.env.local`, and make `vite build` generate a fresh empty initialized database by default.

## Scope

- Database build scripts and package scripts.
- Vite build/dev integration.
- Runtime SQLite asset import flow.
- Environment configuration documentation.
- Database design documentation.

## Impacted Files

- `.env`
- `.env.local`
- `.gitignore`
- `package.json`
- `vite.config.ts`
- `scripts/generate-empty-database.mjs`
- `scripts/generate-preloaded-database.mjs`
- `src/modules/database/connection.ts`
- `docs/design/basic-data-design.md`

## Main Decisions

- `.env` stores shared database configuration keys.
- `.env.local` overrides the local development SQLite database path.
- Build/dev scripts generate `public/assets/databases/liz_money_note.db` and `databases.json` from schema/index SQL.
- Runtime uses `copyFromAssets` only as a first-run bootstrap when there is no existing business data.
- Mock-data database generation remains a development-only command and does not run by default.

## Checklist

- [x] Add environment keys.
- [x] Add empty database generation script.
- [x] Wire Vite dev/build to generate database assets.
- [x] Restore runtime asset bootstrap safely.
- [x] Update docs.
- [x] Verify typecheck, build, sync, and Android package.

## Verification Plan

- `npm run typecheck`
- `npm run build`
- Confirm `dist/assets/databases/liz_money_note.db` exists after build.
- `npm run cap:sync:android`
- Confirm Android assets include the initialized database.
- `cd android && .\gradlew.bat assembleDebug`

## Final Status

Completed.

Verification completed:

- `npm run db:generate-empty:dev`
- `npm run typecheck`
- `npm run build`
- SQLite inspection of `dist/assets/databases/liz_money_note.db`
- `npm run cap:sync:android`
- SQLite inspection of Android synced database asset
- `cd android && .\gradlew.bat assembleDebug`
- APK zip inspection confirmed `assets/public/assets/databases/liz_money_note.db` and `databases.json`
