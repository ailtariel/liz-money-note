# -----------------------------
# Stage 1: Build front-end assets
# -----------------------------
# Keep Node 20 here because the project uses a modern Vite toolchain.
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy only the package manifests first so dependency installation can be cached.
COPY package*.json ./
RUN npm install

# Copy only the files required for the front-end build.
# This keeps nginx-only changes from invalidating the front-end build cache.
COPY index.html ./
COPY env.d.ts ./
COPY jsconfig.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY scripts ./scripts
COPY src ./src

# Build the production assets.
RUN npm run build


# -----------------------------
# Stage 2: Prepare runtime image with nginx
# -----------------------------
FROM nginx:1.28-alpine

WORKDIR /usr/share/nginx/html

# Default nginx runtime variables.
# They can be overridden by Docker, Compose, Helm, or Kubernetes env settings.
ENV NG_PORT=8080
ENV NG_API_UPSTREAM=http://host.docker.internal:8080
ENV NG_AUTH_UPSTREAM=http://host.docker.internal:8080

# Copy static public assets that should remain available as plain files.
COPY ./public/static/ ./static/

# Copy the build output from the build stage.
COPY --from=build-stage /app/dist/ ./


# -----------------------------
# Stage 3: Add nginx configuration
# -----------------------------
# Keep nginx config in a separate layer so nginx-only changes do not invalidate the build stage.

# Copy nginx config files.
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/mime.types /etc/nginx/mime.types
COPY ./nginx/templates/ /etc/nginx/templates/
RUN mkdir -p /etc/nginx/cache

# Setup the custom runtime entrypoint.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Prepare writable directories for the unprivileged nginx user.
RUN mkdir -p /etc/nginx/cache /var/cache/nginx /var/log/nginx /usr/share/nginx/html/config \
  && chown -R nginx:nginx /etc/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
