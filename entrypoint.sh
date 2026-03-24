#!/bin/sh
set -e

echo "[entrypoint] Preparing runtime config..."

escape_for_json() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -Rs . | sed 's/^"//;s/"$//'
    return 0
  fi

  printf '%s' "$1" | awk 'BEGIN{RS="\0"; ORS=""} {gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); gsub(/\r/,"");} {print}' \
    | sed ':a;N;$!ba;s/\n/\\n/g'
}

APP_VARS=$(env | grep '^APP_' | cut -d= -f1 | sort || true)

for var in $APP_VARS; do
  value=$(printenv "$var")
  escaped_value=$(escape_for_json "$value")
  export "$var=$escaped_value"
done

envsubst < /usr/share/nginx/html/config/env-config.template.json > /usr/share/nginx/html/config/env-config.json

echo "[entrypoint] Runtime config written to /usr/share/nginx/html/config/env-config.json"

exec /docker-entrypoint.sh "$@"
