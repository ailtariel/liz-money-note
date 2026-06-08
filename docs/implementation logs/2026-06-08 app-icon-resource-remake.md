# App Icon Resource Remake

## Goal

Regenerate the app icon resources from `docs/design/UI design/app icon.png` and fix install-time icon configuration so Android and browser install surfaces can resolve the expected icon.

## Scope

- Android launcher icon bitmap resources under `android/app/src/main/res/mipmap-*`.
- Android adaptive icon background color under `android/app/src/main/res/values/ic_launcher_background.xml`.
- Web favicon and install icon assets under `public/static/icons/`.
- Web manifest and HTML icon links when needed.

## Main Decisions

- Use the provided design image as the single source of truth.
- Regenerate platform-specific bitmap sizes deterministically instead of introducing new design dependencies.
- Preserve the existing Android manifest references to `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round`.
- Add a web app manifest because `index.html` only had a favicon link, which is insufficient for browser install icon discovery.

## Checklist

- [x] Generate Android mipmap launcher icons.
- [x] Generate Web favicon and install icons.
- [x] Add or update install icon references.
- [x] Verify build and Android sync.

## Verification Plan

- Inspect generated image dimensions and alpha channels.
- Run `npm run build`.
- Run `npm run cap:sync:android`.

## Verification Results

- Generated Android launcher icons were inspected for expected dimensions.
- `npm run build` passed.
- `npm run cap:sync:android` passed.

## Final Status

Completed.
