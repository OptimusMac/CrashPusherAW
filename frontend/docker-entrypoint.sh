#!/bin/sh

echo "🔧 Generating nginx config with:"
echo "   FRONTEND_PORT: ${FRONTEND_PORT}"
echo "   BACKEND_PORT: ${BACKEND_PORT}"

# Устанавливаем значения по умолчанию если переменные пустые
FRONTEND_PORT=${FRONTEND_PORT:-80}
BACKEND_PORT=${BACKEND_PORT:-8081}

echo "   Using FRONTEND_PORT: ${FRONTEND_PORT}"
echo "   Using BACKEND_PORT: ${BACKEND_PORT}"

# Подставляем переменные в nginx конфиг
envsubst '${FRONTEND_PORT} ${BACKEND_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "✅ nginx config generated"
echo "🔍 Checking nginx config..."
nginx -t

echo "🚀 Starting nginx in foreground..."

# 👇 ЗАПУСКАЕМ В FOREGROUND БЕЗ DAEMON OFF
exec nginx -g "daemon off;"