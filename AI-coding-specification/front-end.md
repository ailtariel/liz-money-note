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
- Route layouts own stable shell structure such as route rendering, bottom navigation, drawers, and shared shell boundaries.
- `v-main` belongs to the concrete content page, not the route layout. Each page should compose its own `AppBarVue`, `v-main`, content container, padding, scroll region, and local layout structure.
- A shared app bar component may be rendered by a page when its actions are page-specific. Do not force page-specific actions into a route layout through route-name branching.
- If an app bar is rendered by a page, it must still use the shared app bar component and Vuetify layout APIs so the shell remains visually and behaviorally consistent.
- Actual route pages should focus on feature content and local interaction state.
- Page components should not create their own bottom navigation, drawer, footer, or scroll container unless the route explicitly uses a different layout.
- Avoid page wrapper components that only reproduce responsibilities already owned by the app or layout layer.

## Feature Module Boundaries

- `src/modules/` contains feature modules. A module is a product or business feature that may include pages, route-level UI, domain data, stores, repositories, services, feature composables, and private components.
- Feature pages with domain data, stores, repositories, services, feature composables, and private components belong under `src/modules/<feature>/`.
- `src/components/` contains UI components. A component may include page structure or small local interaction logic, but should not own substantial domain data flow, persistence, repositories, services, or business workflows.
- `src/components/shared/` is only for components reused by multiple features and not bound to one business domain.
- `src/shared/lib/` contains shared logic-only libraries. A lib must not include pages or UI components. Use it for cross-feature logic such as schedulers, formatters, parsers, protocol helpers, or infrastructure utilities.
- Types used by only one Vue file may stay in that Vue file. Types shared across multiple files should move to the nearest feature-level `*.types.ts` or UI-specific types file.

## State, Data Sync, and Messages

- Vue and Pinia state should be treated as the source of UI reactivity. Components should not manually reload data after a mutation merely to make Vue update.
- Store actions that mutate persisted data are responsible for refreshing or updating their own state and directly related store state when that is required for UI consistency.
- Component-level messages are for local form validation or inline page feedback.
- System-level operation feedback, global errors, confirmation flows, toast/snackbar messages, and cross-page interaction prompts should go through a global message module.
- Feature composables may cache a single instance when the module intentionally avoids repeated store/computed/helper setup. Keep this pattern explicit and scoped to the feature.

## Styling Rules

- Prefer Vuetify components, props, utility classes, theme tokens, and configured defaults over custom CSS.
- Custom styles should be limited to component-specific visual customization, such as a card gradient, chart shape, or local option layout.
- Do not use global CSS hacks to calculate core layout height, hide page overflow, or manually compensate for registered Vuetify layout items.
- Keep scroll boundaries explicit: the layout defines fixed regions, and `v-main` defines the remaining content area.
- A floating action button should participate in or respect the Vuetify layout system. Avoid teleporting or manually pinning it unless a component API cannot satisfy the requirement.
