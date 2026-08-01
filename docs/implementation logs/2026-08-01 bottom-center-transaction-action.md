# Bottom-Center Transaction Action

## Goal

Move the high-frequency new-transaction action from the app bar to a bottom-center page action while keeping it separate from the four-item bottom navigation.

## Scope

- Remove the add icon from the transaction app bar.
- Add one fixed, accessible primary action above the bottom navigation on the Transactions page only.
- Reserve page-bottom space so the action does not obscure the last list content.
- Keep the existing full-screen transaction editor and save flow unchanged.

## Impacted Files

- `src/modules/transactions/Transactions.vue`
- `docs/design/app-implementation-details.md`
- `AI-coding-specification/app-rules.md`
- `docs/implementation logs/2026-08-01 project-iteration-roadmap.md`
- `docs/todo.md`

## Main Decisions

- The action is page content, not a fifth navigation item.
- Place it 16 px above the existing 82 px bottom navigation plus the safe-area inset.
- Use the existing `nav.newTransaction` i18n text as the icon button's accessible name.
- Keep the action visible while the list scrolls and reserve 96 px of page-bottom content space.

## Task Checklist

- [x] Move the action and add safe layout spacing.
- [x] Update design and repository behavior documentation.
- [x] Run typecheck and production build.
- [x] Verify mobile layout and editor opening in a browser.
- [x] Update roadmap and to-do status.

## Verification Plan

- Run `npm run typecheck`.
- Run `npm run build` with an isolated generated-asset target if needed.
- At a mobile viewport, confirm the action is horizontally centered above bottom navigation, is unique and accessible, and opens the existing full-screen editor.

## Final Status

Complete.

- `npm run typecheck` passed.
- An isolated production build passed with `DB_ASSET_DIR=.local/bottom-action-build-verification`.
- Browser verification at 430 x 932 confirmed one accessible action centered exactly in the viewport, a 16 px gap above the 82 px bottom navigation, and a 430 x 932 full-screen editor after activation.
- Browser warning and error logs were empty.
- The generated UI verification database was moved to `.local/bottom-action-ui-verification-artifact` and was not committed.
