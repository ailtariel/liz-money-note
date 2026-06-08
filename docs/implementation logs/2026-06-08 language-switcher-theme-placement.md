Author: ailtariel@gmail.com
Updated: 2026-06-08

# Language Switcher Theme Placement

## Goal

Move the language switcher from the More page app bar into Settings > Appearance.

## Scope

- Remove the More page app bar language switcher action.
- Add language selection to the Appearance settings page.
- Reuse existing i18n language labels and locale switching behavior.
- Rename the settings entry from Theme to Appearance.
- Rename the color scheme section from Color scheme to Theme.

## Impacted Files

- `src/components/More.vue`
- `src/modules/theme/Theme.vue`
- `src/i18n/messages/zh-cn.ts`
- `src/i18n/messages/en.ts`

## Decisions

- Use Theme page list items for language selection so the control matches the page's other settings.
- Title the language card with the existing `app.language` key.

## Checklist

- [x] Remove language switcher from More app bar.
- [x] Add language switcher to Theme page.
- [x] Align language selection with the Theme page list item style.
- [x] Update settings and section naming.
- [x] Run typecheck.

## Verification Plan

- Run `npm run typecheck`.

## Final Status

Complete.

Verification:

- `npm run typecheck` passed.
