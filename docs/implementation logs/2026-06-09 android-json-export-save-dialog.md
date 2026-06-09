# Android JSON Export Save Dialog

## Goal

Make JSON data export work inside the Android Capacitor app by opening the Android system save dialog instead of relying on browser-only `<a download>` behavior.

## Scope

- Add an Android Capacitor plugin for JSON file export through Storage Access Framework.
- Keep browser export behavior unchanged.
- Route `Data.vue` export through a platform-aware service.

## Impacted Files

- `android/app/src/main/java/com/ailtariel/lizmoneynote/DataExportPlugin.java`
- `android/app/src/main/java/com/ailtariel/lizmoneynote/MainActivity.java`
- `src/modules/database/export-file.ts`
- `src/modules/database/Data.vue`

## Main Decisions

- Android uses `Intent.ACTION_CREATE_DOCUMENT` with `application/json`, so the user chooses the save location.
- Web keeps the existing Blob URL download path.
- The exported content remains the existing full JSON backup from `exportDatabaseJson()`.

## Task Checklist

- [x] Add Android native export plugin.
- [x] Register plugin in `MainActivity`.
- [x] Add platform-aware export helper.
- [x] Update Data page export action.
- [x] Run targeted verification.

## Verification Plan

- Run `npm run typecheck`.
- Run Android `assembleDebug` to compile the native plugin.

## Final Status

Completed.

Verification:

- `npm run typecheck` passed.
- `android/gradlew assembleDebug -PVERSION_NAME=0.1.0 -PVERSION_CODE=1` passed.

Notes:

- Android export now opens the system save dialog and writes the JSON after the user picks a location.
- Browser export still uses the existing Blob download behavior.
