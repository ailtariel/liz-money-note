# GitHub Actions Android APK Release

## Goal

Create a GitHub CI/CD workflow that builds a signed Android APK and publishes it to GitHub Releases whenever a version tag is pushed.

## Scope

- Add a GitHub Actions workflow under `.github/workflows/`.
- Allow CI to override Android `versionName` and `versionCode` from tag/run metadata.
- Document the required release tag and Android signing secrets.

## Impacted Files

- `.github/workflows/android-apk-release.yml`
- `android/app/build.gradle`
- `README.md`

## Main Decisions

- Tags must use the `v<version>` format, for example `v1.2.3`.
- `versionName` is derived from the tag without the leading `v`.
- `versionCode` is derived from `GITHUB_RUN_NUMBER`.
- Release signing uses GitHub Actions Secrets only. Keystore files and passwords are not committed.
- The workflow fails if required signing secrets are missing.

## Task Checklist

- [x] Add release workflow triggered by tag pushes.
- [x] Install SQLite in CI because the Vite build generates database assets.
- [x] Run `npm ci`, `npm run typecheck`, `npm run build`, and `npm run cap:sync:android`.
- [x] Build unsigned release APK with Gradle.
- [x] Sign and verify the APK with Android SDK build tools.
- [x] Publish signed APK and SHA-256 checksum to GitHub Releases.
- [x] Document release setup.

## Verification Plan

- Validate YAML structure by inspection.
- Run local typecheck/build/Capacitor sync/Android release build where feasible.
- Do not test GitHub Release creation locally because it requires a pushed tag and GitHub Actions secrets.

## Final Status

Implemented.

Verification completed:

- `npm run typecheck` passed.
- `npm run build` passed when using a temporary database file name to avoid a local Windows file lock on `public/assets/databases/liz_money_note.db`.
- `npm run cap:sync:android` passed.
- `android/gradlew assembleRelease -PVERSION_NAME=9.9.9 -PVERSION_CODE=999` passed and produced `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

Not verified locally:

- APK signing, because it depends on GitHub Actions signing secrets.
- GitHub Release creation, because it requires a pushed tag and GitHub Actions runtime.

Full end-to-end release creation must be verified in GitHub Actions after configuring signing secrets and pushing a `v*` tag.
