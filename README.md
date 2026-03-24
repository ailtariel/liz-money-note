# Vue Skeleton

A frontend skeleton repository for starting projects quickly, with reusable engineering defaults, runtime configuration support, and the Nginx / Docker delivery path required for production deployment.

## Capabilities

- Foundation: Vite + TypeScript
- Vue (removable): Vue 3 + Vuetify + Pinia + Vue Router
- Preset pieces:
  - Runtime config loading and merging
  - Base Axios API wrapper
  - Route guards and auth session placeholder implementation
  - Docker / Helm examples
- Nginx server
- Fast production deployment support, including runtime env injection

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Docker

```bash
docker build -t vue-skeleton:local .
docker run --rm -p 80:8080 --env-file .env vue-skeleton:local
```

The nginx process runs as the non-root `nginx` user inside the container, so it listens on a non-privileged port such as `8080`.
External exposure can still use port `80` by mapping `80 -> 8080` in Docker, Compose, Helm, or Kubernetes Service configuration.

At container startup, the flow is:

1. `entrypoint.sh` reads `APP_*` variables from the container environment
2. `public/config/env-config.json` is generated from `public/config/env-config.template.json`
3. Before the app starts, `index.html` reads `env-config.json`
4. The result is written into `sessionStorage`
5. The app reads from `sessionStorage` and merges the result with the default config

## Runtime Env

This repository uses three kinds of environment variables. They have different scopes and should not be mixed.

### 1. `VITE_*`

Purpose:

- Only effective in local development
- Primarily used by `vite.config.ts`
- Typical use cases are local dev server ports and proxy targets

Example:

```env
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_AUTH_PROXY_TARGET=http://localhost:8080
VITE_PORT=8000
VITE_PREVIEW_PORT=5174
```

Notes:

- These variables do not become part of the client runtime config
- Production containers do not depend on them
- Whether they take effect depends on Vite's env loading rules and the current startup mode

### 2. `APP_*`

Purpose:

- Client runtime configuration
- Effective in both local development and production
- Converted into the `snake_case` config object used by the frontend

Example:

```env
APP_APP_TITLE=Vue Skeleton
APP_API_BASE_URL=/api
APP_ENABLE_ROUTE_GUARD=true
APP_DEFAULT_ROUTE=/
APP_FEATURE_FLAGS__SHOW_ABOUT=true
APP_VUETIFY__DEFAULT_THEME=light
```

Mapping result:

- `APP_APP_TITLE` -> `app_title`
- `APP_API_BASE_URL` -> `api_base_url`
- `APP_FEATURE_FLAGS__SHOW_ABOUT` -> `feature_flags.show_about`
- `APP_VUETIFY__DEFAULT_THEME` -> `vuetify.default_theme`

Rules:

- A single underscore stays underscore style
- A double underscore `__` creates object nesting

Local development configuration:

- This repository extracts `APP_*` from `.env` and `.env.production`
- It generates `public/config/env-config.json`
- On page load, that file is written into `sessionStorage`
- App code reads runtime env only from `sessionStorage`

Production configuration:

- Inject `APP_*` when the container or Pod starts
- `entrypoint.sh` uses those variables to generate `env-config.json`
- No frontend rebuild is required

Important:

- If you add a new `APP_*` variable in Helm `values.yaml`, Kubernetes YAML, `docker-compose`, or any other deployment manifest, you must first add the same key to [`.env`](c:/workstation/dev/Vitruvian/vue-skeleton/.env) or `.env.production`
- The reason is that the key list in `env-config.template.json` is generated at build time from `.env` and `.env.production`
- If the key does not exist at build time, setting that variable in the production container later will still not write it into the final `env-config.json`

### 3. `NG_*`

Purpose:

- Only used for Nginx template rendering inside the production container
- Not exposed as frontend runtime config

Example:

```env
NG_PORT=8080
NG_API_UPSTREAM=http://your-api-service:8080
NG_AUTH_UPSTREAM=http://your-auth-service:8080
```

Notes:

- These variables are mainly consumed by `nginx/templates/default.conf.template`
- Local `npm run dev` does not depend on them
- In production they can be overridden directly in Docker, Helm, or Kubernetes YAML

## React Migration

If you want to turn this skeleton into a React-based project, it is best to replace only the UI layer and keep the runtime config and deployment pipeline unchanged.

A practical migration path is:

1. Keep the `Vite + TypeScript + Docker + Nginx + runtime env` structure
2. Remove `vue`, `vuetify`, `pinia`, and `vue-router`
3. Replace them with `react`, `react-dom`, and your preferred routing and state management stack
4. Rewrite the entry in [src/main.ts](c:/workstation/dev/Vitruvian/vue-skeleton/src/main.ts)
5. Keep infrastructure that is only weakly coupled to the UI framework, such as [src/core/app-config.ts](c:/workstation/dev/Vitruvian/vue-skeleton/src/core/app-config.ts) and [src/core/api.ts](c:/workstation/dev/Vitruvian/vue-skeleton/src/core/api.ts)

This keeps the migration scope small while preserving runtime config, container deployment, and proxy capabilities.
