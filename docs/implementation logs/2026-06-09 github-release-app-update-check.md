# GitHub Release App Update Check

## Goal

Add an app update check that reads the latest GitHub Release, compares it with the bundled app version, and runs on app startup plus every 60 minutes through the existing cron job manager.

## Scope

- Add shared update-check logic under `src/shared/lib/`.
- Inject the bundled app version at Vite build time.
- Call the update checker from `App.vue`.
- Register a 60-minute cron job for repeated checks.
- Add i18n messages for update availability.
- Show update availability as a red badge on the More > About entry.
- Add About page actions for manual update checks and APK update installation.

## Impacted Files

- `src/shared/lib/app-update/types.ts`
- `src/shared/lib/app-update/index.ts`
- `src/App.vue`
- `src/modules/app-update/app-update.store.ts`
- `src/components/More.vue`
- `src/components/About.vue`
- `src/components/shared/more-navigation.ts`
- `src/router/index.ts`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `vite.config.ts`
- `.github/workflows/android-apk-release.yml`
- `env.d.ts`
- `.env`
- `src/core/app-config.ts`
- `src/types/runtime-config.ts`
- `android/app/src/main/java/com/ailtariel/lizmoneynote/AppUpdatePlugin.java`
- `android/app/src/main/java/com/ailtariel/lizmoneynote/MainActivity.java`
- `android/app/src/main/AndroidManifest.xml`

## Main Decisions

- Use `APP_UPDATE_MANIFEST_URL` as the remote update source.
- Configure the default value as GitHub Releases latest API:
  `https://api.github.com/repos/ailtariel/liz-money-note/releases/latest`.
- Treat the GitHub Release response as the update manifest.
- Use `package.json` version as the bundled app version for local builds.
- Use the pushed tag version as the bundled app version in the GitHub Actions release build.
- Store update availability in a Pinia store.
- Show a red `v-badge` on the About entry when a newer version exists.
- Do not show snackbar messages for update availability.
- Manual checks from About show snackbar results.
- Android update installation downloads the APK into app cache and reuses it when already downloaded.
- Web fallback opens the release/download URL in a new browser tab.
- Log check failures to console instead of interrupting users.

## Task Checklist

- [x] Add shared app update library.
- [x] Inject `__APP_VERSION__`.
- [x] Add app startup and cron-job calls.
- [x] Add i18n messages.
- [x] Add About route and update badge.
- [x] Add manual About page update check.
- [x] Add Android APK download/install plugin.
- [x] Run targeted verification.

## Verification Plan

- Run `npm run typecheck`.
- Run `npm run build` if the local database asset is not locked.

## Final Status

Completed.

Verification:

- `npm run typecheck` passed.
- `android/gradlew assembleRelease -PVERSION_NAME=9.9.9 -PVERSION_CODE=999` passed.
- `npm run build` is blocked locally by a Windows file lock on `public/assets/databases/liz_money_note.db`.
- `DB_FILE_NAME=liz_money_note_verify.db BUILD_APP_VERSION=9.9.9 npm run build` passed and verified the Vite build path plus build-time app version injection without changing tracked source files.

Notes:

- Update availability is stored in `src/modules/app-update/app-update.store.ts`.
- The More > About entry displays a red `v-badge` when a newer GitHub Release is available.
- Startup and cron checks do not show snackbar messages.
- The About page manual check button shows snackbar results.
- The update button downloads the APK through the Android plugin and opens the Android system installer.
