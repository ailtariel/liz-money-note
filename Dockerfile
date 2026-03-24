FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.28-alpine

ENV NGINX_PORT=8080
ENV API_UPSTREAM=http://host.docker.internal:8080
ENV AUTH_UPSTREAM=http://host.docker.internal:8080

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/templates /etc/nginx/templates
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/cache /usr/share/nginx/html/config \
  && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
