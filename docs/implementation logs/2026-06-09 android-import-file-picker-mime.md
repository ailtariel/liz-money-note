# Android Import File Picker MIME Compatibility

## Goal

Make Android file selection for text data import show CSV/TXT files on stricter OEM file pickers such as vivo/OriginOS.

## Scope

- Adjust the data import file input accept list.
- Keep the existing CSV/TXT import parser and import workflow unchanged.

## Impacted Files

- `src/modules/database/Data.vue`

## Decisions

- Use a broader accept list because Android file providers can report CSV files as `text/csv`, `application/csv`, `application/vnd.ms-excel`, `text/plain`, or `application/octet-stream`.
- Include `*/*` as the final compatibility fallback so OEM file pickers do not hide valid import files only because their MIME detection differs.
- Continue validating content through the existing parser after the user selects files.

## Checklist

- [x] Update file input accept list.
- [x] Run targeted type checking.

## Verification Plan

- `npm run typecheck`

## Verification Results

- `npm run typecheck`: passed.

## Final Status

Completed.
