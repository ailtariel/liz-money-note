Author: ailtariel@gmail.com
Updated: 2026-06-06

# Front-End Layout Specification

This document defines repository-level rules for frontend layout, page structure, and component-library usage.

## Vuetify Application Layout

- Use Vuetify's application layout system for common app structure before writing custom CSS.
- Keep `v-app`, `v-layout`, layout items such as `v-app-bar`, `v-navigation-drawer`, `v-bottom-navigation`, `v-footer`, and `v-main` in the same layout boundary unless a nested layout is intentionally required.
- Do not insert arbitrary DOM wrappers between Vuetify application layout components when those wrappers duplicate, bypass, or break Vuetify's layout registration.
- Let `v-main` consume Vuetify layout information and own the page content area reserved after headers, footers, drawers, and bottom navigation.
- Use Vuetify layout props and component APIs, such as `height`, `location`, `order`, `absolute`, `app`, and `offset`, before adding manual position or size calculations.
- If a common application layout requires extensive CSS, stop and re-check Vuetify documentation and examples before continuing.

## App, Layout, and Page Boundaries

- `App.vue` loads the application-level providers, global modules, and top-level overlays that apply to the entire app.
- `src/components/layouts/` contains route layouts. A screens layout, a login layout, and other shell variants should be separate layout components.
- Headers, footers, bottom navigation, drawers, and other common shell elements belong in layout components, not in page components.
- Actual route pages are rendered inside `v-main` and should focus on feature content and local interaction state.
- Page components should not create their own app-level header, footer, bottom navigation, or scroll container unless the route explicitly uses a different layout.
- Avoid page wrapper components that only reproduce responsibilities already owned by the app or layout layer.

## Styling Rules

- Prefer Vuetify components, props, utility classes, theme tokens, and configured defaults over custom CSS.
- Custom styles should be limited to component-specific visual customization, such as a card gradient, chart shape, or local option layout.
- Do not use global CSS hacks to calculate core layout height, hide page overflow, or manually compensate for registered Vuetify layout items.
- Keep scroll boundaries explicit: the layout defines fixed regions, and `v-main` defines the remaining content area.
- A floating action button should participate in or respect the Vuetify layout system. Avoid teleporting or manually pinning it unless a component API cannot satisfy the requirement.
