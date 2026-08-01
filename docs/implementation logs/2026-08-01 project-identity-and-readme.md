# Project Identity and README

## Goal

Replace the inherited Vue Skeleton documentation and public-facing defaults with an accurate Liz Money Note development, data, build, and release guide.

## Scope

- Rewrite the root README around the current local-first money application.
- Document the development-seed, generated-asset, and runtime-database boundaries.
- Document Web, Android debug, and tagged GitHub Release workflows.
- Replace remaining public-facing skeleton names in package, runtime, Compose, and Helm defaults.
- Keep compatibility-only internal storage keys and unverified deployment behavior unchanged.

## Impacted Files and Modules

- `README.md`
- `.env`
- `package.json`
- `package-lock.json`
- `src/core/app-config.ts`
- `docker-compose.yml`
- `helm/values.yaml`
- `Dockerfile`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Main Decisions

- Use npm commands in the README because `package-lock.json` and GitHub Actions define npm as the reproducible project workflow.
- Present Android as the primary packaged target and Vite as the local Web development target.
- Explain that `.local/databases` is a development seed, `public/assets/databases` is a generated transport asset, and runtime writes belong to IndexedDB or Android private SQLite storage.
- Do not tell developers to edit generated database assets directly.
- Keep the existing `vue-skeleton:auth` storage key because renaming it is a compatibility migration, not project branding.
- Do not claim that the inherited Docker/Helm delivery path is verified by this documentation-only iteration.

## Task Checklist

- [x] Rewrite the README.
- [x] Update public-facing project identity defaults.
- [x] Verify package-lock consistency and typecheck.
- [x] Update roadmap and to-do status.

## Verification Plan

- Run `npm ci --ignore-scripts` only if lockfile consistency is uncertain; otherwise validate the edited lockfile structurally.
- Run `npm run typecheck`.
- Run `git diff --check`.
- Review every README command against `package.json` and the Android release workflow.

## Final Status

Complete.

- `npm ci --ignore-scripts --dry-run` confirmed package-lock consistency.
- `npm run typecheck` passed.
- `DB_ASSET_DIR=.local/readme-build-verification npm run build` passed with no warnings.
- README commands were checked against `package.json`, `capacitor.config.ts`, and `.github/workflows/android-apk-release.yml`.
