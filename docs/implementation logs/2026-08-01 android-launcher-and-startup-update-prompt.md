# Android Launcher and Startup Update Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use an executing-plans equivalent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the packaged Android launcher contract and show one non-blocking update prompt when the first automatic update check of an app session finds a newer release.

**Architecture:** Treat launcher visibility as a packaging/device diagnosis rather than regenerating already valid resources. Reuse the existing app-update Pinia store and native installer from the App root, which already owns global startup work and overlays; the recurring-event sheet and About workflows remain unchanged.

**Tech Stack:** Android Manifest/AAPT, Capacitor 8, Vue 3.5, Pinia 3, Vuetify 4.1, vue-i18n.

---

## Root-Cause Evidence: Launcher Icon

- The source and merged manifests declare exported `MainActivity` with `android.intent.action.MAIN` and `android.intent.category.LAUNCHER`.
- `aapt dump badging` reports `com.ailtariel.lizmoneynote.MainActivity` as the launchable activity.
- The APK contains adaptive icon XML plus legacy launcher and round icon resources for mdpi through xxxhdpi.
- Visual inspection confirms both legacy and foreground bitmaps contain the expected non-transparent artwork.
- Package name, Gradle namespace, Capacitor app ID, Java package, and FileProvider authority are consistent.
- No Android device is connected, so OEM launcher behavior after a clean sideload cannot be reproduced in this environment.

**Conclusion:** The repository currently satisfies Android's launcher contract. Do not add deprecated shortcut-install permissions or regenerate identical resources without device evidence. Keep clean-install/device-launcher reproduction as an explicit verification gap.

## Files

- Modify: `src/App.vue`
- Modify: `src/i18n/messages/zh-cn.ts`
- Modify: `src/i18n/messages/en.ts`
- Modify: `docs/todo.md`
- Modify: `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- Verify: `android/app/src/main/AndroidManifest.xml`
- Verify: `android/app/build/outputs/apk/debug/app-debug.apk`

## Task 1: Add the One-Time Startup Prompt

- [x] Add App-root prompt visibility and one-time startup-check state.
- [x] Make the immediate cron check eligible to show the prompt only once per App session.
- [x] Reuse `appUpdateStore.install()` for the primary action.
- [x] Keep installation failures in the global snack queue and console log.
- [x] Use a Vuetify dialog/card with confirm on the left and Later on the right.
- [x] Disable the install action when neither an APK nor release URL is available.
- [x] Add Chinese and English prompt text.

## Task 2: Verify Web and Android Outputs

- [x] Run `npm run typecheck`.
- [x] Run isolated production builds using disposable database asset directories.
- [x] Run `npm run cap:sync:android`.
- [x] Run `android/gradlew assembleDebug`.
- [x] Inspect APK badging, launcher activity, and packaged icon resources with `aapt`.
- [x] Perform browser verification of the no-update path and an intentionally outdated build.

## Task 3: Close the Iteration and Commit

- [x] Update `docs/todo.md` without claiming device-only icon behavior was reproduced.
- [x] Update the roadmap with the completed prompt and remaining device verification gap.
- [x] Record final verification results in this document.
- [x] Create one Git commit for this iteration.

## Final Status

Completed on 2026-08-01.

Completed:

- The first automatic update check in an App session opens one non-blocking prompt when a newer release is found.
- The prompt reuses the existing installer, preserves the About badge/manual action, exposes install failures through the global snack queue, and does not reappear during client-side navigation after the user chooses Later.
- `npm run typecheck`, isolated production builds, `npm run cap:sync:android`, and `android/gradlew assembleDebug` passed.
- A temporary `0.0.0` build detected GitHub release `0.1.7`, displayed the English prompt, closed through Later, retained the About badge, and produced no browser warnings or errors.
- The normal `0.1.0` development build followed the no-update path without showing a prompt or logging errors.

Device acceptance:

- The user confirmed that the Android package runs correctly and explicitly closed further Android device/launcher investigation for this iteration.
- A follow-up environment audit confirmed that `C:\Software\platform-tools\adb.exe` is available but `adb devices -l` returns no devices. No Android Emulator executable, configured `ANDROID_HOME`, or configured `ANDROID_SDK_ROOT` is available on this workstation.
- The existing debug APK remains available at `android/app/build/outputs/apk/debug/app-debug.apk`.
- Because the packaged launcher contract is valid, no speculative Android resource or permission change was made.

Follow-up behavior correction:

- `docs/implementation logs/2026-08-01 android-release-app-update-gate.md` now limits the startup prompt, recurring check, badge, and About action to explicitly enabled Android Release builds. Web and Dev no longer run or render update behavior.
