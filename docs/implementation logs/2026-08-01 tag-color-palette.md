# Tag Color Palette

## Goal

Give Tags a reusable preset palette and deterministic color rotation across existing-data migration, manual creation, text import, and development preload generation.

## Scope

- Define one shared Tag palette and modulo-based color selector.
- Backfill only Tags whose color is null or blank.
- Preselect the next palette color in the Tag editor while retaining custom color input.
- Assign palette colors when text import creates a new Tag.
- Keep preload and mock-import verification scripts aligned with runtime behavior.
- Preserve all existing non-empty custom colors.

## Impacted Files and Modules

- `src/modules/tags/tag-colors.ts`
- `src/modules/tags/tag.repository.ts`
- `src/modules/tags/Tags.vue`
- `src/modules/database/migrations.ts`
- `src/modules/import/import.service.ts`
- `src/i18n/messages/en.ts`
- `src/i18n/messages/zh-cn.ts`
- `scripts/generate-preloaded-database.mjs`
- `scripts/verify-mockdata-sqlite-import.mjs`
- `docs/design/basic-data-design.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Main Decisions

- Use a fixed ten-color palette and `index % palette.length`; do not use random colors.
- Existing blank colors use `id - 1` as their deterministic index. Existing non-empty colors are never changed.
- Runtime creation reads the SQLite `tags` AUTOINCREMENT sequence when no explicit color is supplied, so deletion does not rewind automatic rotation.
- Text import creates a color allocator once per import batch and advances it only when a new Tag is inserted.
- The manual editor exposes palette swatches and still keeps `v-color-input` for custom choices.

## Task Checklist

- [x] Add shared palette utilities.
- [x] Add migration and runtime/import assignment.
- [x] Add editor palette controls and localized labels.
- [x] Align preload and verification scripts.
- [x] Update design and roadmap documentation.
- [x] Run typecheck, build, import verification, and focused UI checks.

## Verification Plan

- Verify palette cycling and negative-index normalization with Node.
- Run `npm run typecheck`.
- Run `npm run build` with an isolated generated-asset target if required by the external Windows file lock.
- Run `node --experimental-strip-types scripts/verify-mockdata-sqlite-import.mjs`.
- Open the Tag editor and verify the next swatch is selected, swatches change the color input, and existing Tag colors remain visible.

## Final Status

Complete.

- The pure palette boundary check verified the first color, modulo cycling, and negative-index normalization.
- `npm run typecheck` passed.
- `DB_ASSET_DIR=.local/tag-color-build-verification npm run build` passed with no warnings.
- `node --experimental-strip-types scripts/verify-mockdata-sqlite-import.mjs` passed with 21 Tags, zero blank colors, 2,950 transactions, and zero balance mismatches.
- `npm run db:generate-preload` passed.
- Focused browser verification confirmed 21 migrated Tag colors, ten preset swatches, the expected next default color, swatch selection, and no console warnings or errors.
- Generated UI assets were moved to ignored `.local/tag-color-ui-verification-artifact` after testing.
