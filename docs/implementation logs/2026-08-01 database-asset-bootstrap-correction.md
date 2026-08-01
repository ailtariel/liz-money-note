# Database Asset Bootstrap Correction

## Goal

Restore the documented database lifecycle so development seed data and production empty assets are imported before runtime migrations on a first launch, while existing runtime data remains untouched.

## Scope

- Correct runtime database existence detection and asset bootstrap order.
- Keep `.local/databases` as the development seed source.
- Keep `public/assets/databases` as a generated single-database asset directory.
- Remove stale verification databases from generated Web and Android assets.
- Update the database lifecycle design documentation.

## Root Cause

`getDatabase()` opened a new runtime database and ran migrations before deciding whether assets should be imported. The book-account migration inserts a default account into an empty database, so `hasPersistedData()` returned `true` and skipped `copyFromAssets()` even on a first launch.

The generated asset directory also retained old verification `.db` files. Android's SQLite plugin copies every `.db` file under `public/assets/databases`, so manifest-unlisted verification databases could still enter the application package and private database directory.

## Impacted Files

- `src/modules/database/connection.ts`
- `scripts/generate-empty-database.mjs`
- `docs/design/basic-data-design.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- Generated ignored database assets under `public/`, `dist/`, and `android/app/src/main/assets/`

## Main Decisions

- Use `SQLiteConnection.isDatabase(databaseName)` before creating or migrating a connection.
- If the runtime database does not exist, call `copyFromAssets()` first, then open and migrate it.
- If the runtime database already exists, never overwrite it during normal startup.
- Remove the localStorage asset marker because runtime database existence is the authoritative bootstrap condition.
- Restrict `DB_ASSET_DIR` to the configured `DB_FILE_NAME` plus `databases.json` by deleting other `.db` files during generation.
- Do not copy runtime Web or Android changes back into `.local` or `public/assets`.

## Checklist

- [x] Replace post-migration data-count detection with pre-connection database existence detection.
- [x] Keep reset behavior as delete runtime database, copy assets, then open and migrate.
- [x] Clean unexpected `.db` files from the configured asset directory during generation.
- [x] Update the data design with source, asset, and runtime database ownership.
- [x] Move confirmed stale verification database assets into a recoverable local backup.
- [x] Run `npm run typecheck`.
- [x] Run an isolated production build without touching the active development database asset.
- [x] Verify generated assets contain only the configured database and manifest.
- [x] Run Android asset sync and inspect the synchronized database directory.
- [x] Verify a fresh Web origin imports the seeded asset before migrations.

## Verification Plan

- `npm run typecheck`
- `DB_ASSET_DIR=.local/build-verification/database-bootstrap npm run build`
- SQLite count inspection for the development seed and synchronized development asset.
- Directory inspection for `public/assets/databases`, `dist/assets/databases`, and Android synchronized assets.
- Static startup-flow review for first launch, existing runtime data, and confirmed database reset.

## Final Status

Completed on 2026-08-01.

- `npm run typecheck` passed.
- The isolated production build passed with `DB_ASSET_DIR=.local/build-verification/database-bootstrap`; an injected unexpected `.db` file was removed by the generator.
- `public`, `dist`, the isolated build asset directory, and Android synchronized assets contain only `liz_money_note.db` and `databases.json`.
- `npm run cap:sync:android` passed.
- A fresh Web origin opened the seeded transaction history with no browser warnings or errors, confirming asset import occurs before migrations.
- Stale generated verification databases were moved to `.local/removed-database-assets/2026-08-01/` and remain recoverable.
