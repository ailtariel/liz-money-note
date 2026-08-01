# Android Release App Update Gate

## Goal

Restrict app update checks, prompts, badges, and manual actions to explicitly enabled Android release builds. Web and local development must not run or display app update behavior.

## Root Cause

- `.env` provides `APP_UPDATE_MANIFEST_URL` for every runtime.
- `src/App.vue` registers an immediate update cron job on every platform.
- The update store checks only whether a manifest URL exists; it does not enforce a platform or release-channel boundary.
- The About update action is always rendered, while Android is checked only at installation time.

## Scope

- Add a disabled-by-default `APP_FEATURE_FLAGS__ENABLE_APP_UPDATE` runtime flag.
- Enable the flag only while building the tagged Android Release workflow.
- Centralize the effective capability as Android platform plus the explicit feature flag.
- Apply the capability to automatic checks, recurring checks, startup prompts, badges, manual checks, and installation.
- Update the runtime configuration and product/release documentation.

## Impacted Files

- `.env`
- `.github/workflows/android-apk-release.yml`
- `helm/values.yaml`
- `public/config/env-config.template.json`
- `scripts/generate-env-template.ts`
- `src/core/app-config.ts`
- `src/types/runtime-config.ts`
- `src/modules/app-update/app-update.store.ts`
- `src/App.vue`
- `src/components/About.vue`
- `README.md`
- `docs/design/app-implementation-details.md`
- `docs/implementation logs/2026-06-09 github-release-app-update-check.md`
- `docs/implementation logs/2026-08-01 android-launcher-and-startup-update-prompt.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Main Decisions

- The effective predicate is `Capacitor.getPlatform() === 'android'` and `feature_flags.enable_app_update === true`.
- `import.meta.env.PROD` is not used because a production Web build and an Android package can both contain production Vite assets.
- The default and Web deployment values remain `false`.
- The tagged Android Release workflow sets the flag to `true` only for the Web asset build that is synchronized into the APK.
- The app-update store owns the predicate and defensively blocks direct check/install actions when disabled.
- Call sites use the same store capability to avoid registering the cron job or rendering update UI.

## Task Checklist

- [x] Add the runtime feature flag and explicit feature-flag type.
- [x] Add the shared app-update capability to the Pinia store.
- [x] Gate startup/recurring checks and the startup prompt.
- [x] Gate the About action and More-page badge state.
- [x] Enable the flag only in the Android Release workflow.
- [x] Update runtime, product, and historical behavior documentation.
- [x] Run typecheck, isolated builds, and Web behavior verification.
- [x] Review and commit the completed iteration.

## Verification Plan

- Run `npm run typecheck`.
- Build with the default disabled flag into an isolated database asset directory and confirm the generated runtime template includes `false` by default.
- Build with `APP_FEATURE_FLAGS__ENABLE_APP_UPDATE=true` and confirm the Android Release asset configuration includes the enabled value.
- Run the Web app with the flag forced to `true` and confirm the Android platform predicate still suppresses the update cron job, startup prompt, badge, and About action.
- Confirm browser logs contain no update-check failure and the page does not request the GitHub Release endpoint.
- Review the workflow diff without repeating Android device checks, per user confirmation.

## Final Status

Completed on 2026-08-01.

Verification:

- `npm run typecheck` passed.
- An isolated default build passed and emitted `APP_FEATURE_FLAGS__ENABLE_APP_UPDATE=false` in `dist/config/env-config.json`.
- An isolated simulated Release build with `BUILD_APP_VERSION=9.9.9` passed, injected that version, and emitted `APP_FEATURE_FLAGS__ENABLE_APP_UPDATE=true`.
- A Web dev session was intentionally started with the update flag set to `true`. CDP captured 141 startup requests and zero requests to the configured GitHub Release endpoint, proving that the platform predicate blocked the update cron job.
- The Web startup update-dialog count was zero. The About page rendered the current version with zero action buttons and zero dialogs, and a clean verification tab produced no warning or error logs.
- Android device checks were not repeated, per the user's explicit confirmation that Android already runs correctly.
