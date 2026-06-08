# App Icon Resource Refresh

## Goal

Refresh all browser and Android app icon resources from `docs/design/UI design/app icon.png`.

## Scope

- Browser favicon and install icons under `public/static/icons/`.
- Web app manifest icon references in `public/manifest.webmanifest`, only if a reference gap is found.
- Android launcher icon bitmap resources under `android/app/src/main/res/mipmap-*`.
- Android adaptive icon references and background color, only if a reference gap is found.

## Main Decisions

- Use the provided design image as the single source of truth.
- Regenerate existing icon file names and sizes to preserve current references.
- Do not introduce new image generation dependencies.
- Do not change product behavior, routes, or app UI code.

## Checklist

- [x] Inspect existing icon references and target sizes.
- [x] Regenerate browser icon resources.
- [x] Regenerate Android launcher icon resources.
- [x] Verify generated dimensions and project build/sync.

## Verification Plan

- Inspect generated image dimensions.
- Run `npm run build`.
- Run `npm run cap:sync:android`.

## Verification Results

- Generated browser icon dimensions were inspected:
  - `favicon-32.png`: 32x32
  - `favicon-48.png`: 48x48
  - `app-icon-192.png`: 192x192
  - `app-icon-512.png`: 512x512
  - `app-icon-maskable-512.png`: 512x512
- Generated Android launcher icon dimensions were inspected for `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi`.
- `npm run typecheck` passed.
- `npm run cap:sync:android` passed.
- `npm run build` was attempted but blocked before app bundling because `public/assets/databases/liz_money_note.db` was locked by the running local `npm run dev` / Vite process.

## Final Status

Completed, with build verification blocked by an existing local database file lock.
