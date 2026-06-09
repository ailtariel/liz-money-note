# Android Native Import File Picker

## Goal

Use a native Android document picker for CSV/TXT import while keeping the browser import flow unchanged.

## Scope

- Add a global system state store for platform/device-type state.
- Add an Android Capacitor plugin that opens `ACTION_OPEN_DOCUMENT`.
- Add a frontend wrapper for native import file selection.
- Update the data import page to call the native picker on Android and keep `v-file-input` on Web.

## Impacted Files

- `src/app/system.store.ts`
- `src/modules/database/import-file.ts`
- `src/modules/database/Data.vue`
- `android/app/src/main/java/com/ailtariel/lizmoneynote/DataImportPlugin.java`
- `android/app/src/main/java/com/ailtariel/lizmoneynote/MainActivity.java`

## Decisions

- Platform detection is centralized in the app-level `useSystemStore`.
- `useSystemStore` lives under `src/app` because it describes app runtime state, not the System feature module.
- Android uses `Intent.ACTION_OPEN_DOCUMENT` with `*/*` and multiple selection support.
- `CATEGORY_OPENABLE` was removed for vivo X300 verification because the device may hide document entries when the picker is constrained to openable document-provider items.
- The native plugin reads selected `content://` URIs through `ContentResolver`, then returns UTF-8 text content to the existing import flow.
- Browser/Web keeps the existing `v-file-input` and `FileReader` path.
- The Web file input keeps the CSV/TXT `accept` filter because Android no longer renders that input.
- No storage or folder permission is added; the picker grants read access only to user-selected files.

## Checklist

- [x] Add system state store.
- [x] Add native Android import picker plugin.
- [x] Register the native plugin.
- [x] Add frontend native picker wrapper.
- [x] Branch the data import page by system state.
- [x] Run targeted verification.

## Verification Plan

- `npm run typecheck`
- Android Gradle compile check if local Android toolchain is available.

## Verification Results

- `npm run typecheck`: passed.
- `android/gradlew.bat :app:assembleDebug`: passed.
- `npm run typecheck`: passed after moving `useSystemStore` from `src/modules/system` to `src/app`.

## Final Status

Completed.
