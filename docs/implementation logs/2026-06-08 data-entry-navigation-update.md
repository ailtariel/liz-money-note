Author: ailtariel@gmail.com
Updated: 2026-06-08

# Data Entry Navigation Update

## Goal

Move the Data entry out of the standalone More page section and place it under the Features section. The Data page should present two operation areas: Import and Export.

## Scope

- Update More page navigation grouping.
- Keep the existing Data feature route and component.
- Simplify the Data page presentation to Import and Export areas.
- Update i18n copy where the visible behavior changes.
- Update directly related design notes.

## Impacted Files

- `src/components/shared/more-navigation.ts`
- `src/router/index.ts`
- `src/modules/database/Data.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`
- `docs/design/more-navigation-update.md`

## Decisions

- The Data entry uses the existing `data` route and stays under the More page Features section.
- Import includes CSV / TXT import and existing JSON restore controls because restore is an import-like data input operation.
- Export keeps the existing JSON export operation.
- Old direct data action routes are redirected to `data` to avoid broken links while removing them from navigation.

## Checklist

- [x] Update navigation grouping.
- [x] Update Data route metadata and old action route redirects.
- [x] Split Data page into Import and Export sections.
- [x] Update i18n labels and related design document.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.
- Review navigation and Data page structure statically for the requested information architecture.

## Final Status

Complete.

Verification:

- `npm run typecheck` passed.
- Static review confirmed the standalone Data section was removed from More navigation and the Data page now presents Import and Export areas.
