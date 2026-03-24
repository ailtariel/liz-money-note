# Vue Skeleton

Reusable Vue 3 starter repository based on the delivery patterns used in `vitruvian-web`, trimmed down into a project-ready baseline.

## Included capabilities

- Vite + Vue 3 + TypeScript
- Vue Router with route meta guards
- Vuetify 3 with theme defaults
- Pinia store bootstrap
- Axios request layer with runtime `api_base_url`
- Runtime config merge before app mount
- Docker + Nginx delivery
- Container startup injection of server-side `APP_*` environment variables

## Why this skeleton keeps runtime config

This repo follows the most reusable pattern from `vitruvian-web`:

1. Default config lives in `src/config/runtime-config.ts`
2. Build step generates `public/config/env-config.template.json` from `APP_*` keys
3. Container startup uses `entrypoint.sh` and `envsubst` to generate `env-config.json`
4. `index.html` preloads runtime env into `sessionStorage`
5. Frontend boot merges `default config + APP_*`

This lets you change deployment config without rebuilding the frontend image.
In local development, Vite also generates `public/config/env-config.json` from `.env` and `.env.production`, and the browser writes it into `sessionStorage` before the app starts.

## Runtime env naming convention

- `APP_APP_TITLE=My App` -> `app_title`
- `APP_API_BASE_URL=/api` -> `api_base_url`
- `APP_FEATURE_FLAGS__SHOW_ABOUT=true` -> `feature_flags.show_about`
- `APP_VUETIFY__DEFAULT_THEME=dark` -> `vuetify.default_theme`

Single underscore stays underscore style. Double underscore creates a nested object.

## Env variable groups

- `VITE_*`: development-only variables used by Vite itself, such as local dev server proxy targets.
- `APP_*`: runtime client config used in all environments. In production these values are injected when the container or pod starts.
- `NG_*`: nginx runtime variables used only in production container runtime for nginx template rendering.

## Local development

```bash
npm install
npm run dev
```

By default the Vite dev server reads `.env.development`.

## Production build

```bash
npm run build
```

## Docker

```bash
docker build -t vue-skeleton:local .
docker run --rm -p 8080:8080 --env-file .env.example vue-skeleton:local
```

The container entrypoint writes:

- `/usr/share/nginx/html/config/env-config.json`

from:

- `/usr/share/nginx/html/config/env-config.template.json`

## Suggested next additions from `vitruvian-web`

- `vue-i18n` if your products target multiple locales
- Shared WebSocket / SSE proxy snippets if the backend streams
- SSO callback handling and permission-aware route guards
- ESLint / Prettier / Vitest if you want stronger defaults
- Request/response error normalization and API modules once your backend contracts stabilize
