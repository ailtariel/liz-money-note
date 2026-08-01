# Build Warning Cleanup

## Goal

Remove the two verified production-build warnings without adding unnecessary browser polyfills or disguising an unmeasured bundle regression.

## Scope

- Audit the `jeep-sqlite` Node `crypto` externalization warning.
- Measure the Statistics route chunk and confirm the ECharts import strategy.
- Update the Vite 8 configuration to current Rolldown option names.
- Keep unrelated application and product behavior unchanged.

## Impacted Files and Modules

- `vite.config.ts`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Findings and Decisions

- `jeep-sqlite@2.8.0` bundles an Emscripten random-device initializer that uses browser `crypto.getRandomValues` first and keeps `require("crypto")` only as its Node fallback. Vite already replaces that fallback import with an empty browser external module, and the browser branch does not execute it.
- A browser `crypto` polyfill would add code without serving the active runtime path. Filter only the exact warning emitted for the audited `jeep-sqlite` module; all other externalized-module warnings must remain visible.
- The Statistics route already uses `echarts/core`, named chart/component imports, and the Canvas renderer. A source-map audit attributes the large majority of the route to the required ECharts and ZRender runtime.
- The Statistics route is already lazy-loaded. Its measured production size is 545.13 kB minified and 184.64 kB gzip. Set an explicit 600 kB warning budget instead of forcing artificial chunk boundaries that do not reduce download or execution work.
- Replace deprecated `build.rollupOptions` with Vite 8 `build.rolldownOptions`.

## Task Checklist

- [x] Capture and inspect the exact `jeep-sqlite` warning and generated browser bundle.
- [x] Measure the Statistics route chunk with a production source map.
- [x] Confirm that ECharts already uses its tree-shakeable entry points.
- [x] Add a narrowly scoped Vite logger filter for the audited dependency warning.
- [x] Set the measured route chunk budget and migrate to `rolldownOptions`.
- [x] Run typecheck and a production build with no warnings.
- [x] Update the roadmap and to-do status.

## Verification Plan

- Run `pnpm typecheck`.
- Run `pnpm build` and confirm that no Vite/Rolldown warning is emitted.
- Confirm the Statistics chunk remains below the documented 600 kB budget.
- Confirm a non-`jeep-sqlite` warning would still delegate to Vite's default logger by code inspection.

## Final Status

Complete.

- `pnpm typecheck` passed.
- `DB_ASSET_DIR=.local/build-verification pnpm build` passed with no warnings; the Statistics chunk remained 545.08 kB minified and 184.61 kB gzip.
- The temporary asset-directory override was used because an external editor process held the ignored checked-in-path database asset open on Windows. It changes only the generated verification target, not the bundle configuration or runtime database contract.
