#!/bin/bash
set -e

echo "🔍 Проверка и настройка портов..."

# ===== Определяем локальный IP один раз =====
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    LOCAL_IP=$(powershell.exe -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet* | Where-Object {$_.PrefixOrigin -eq 'Dhcp'}).IPAddress" | tr -d '\r')
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# ===== Проверка, свободен ли порт =====
is_port_free() {
    local port=$1
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash / MINGW64)
        if netstat -ano | grep -q ":$port[[:space:]]"; then
            return 1  # занят
        else
            return 0  # свободен
        fi
    else
        # Linux / Mac
        if command -v ss >/dev/null 2>&1; then
            ! ss -tuln | grep -q ":$port "
        elif command -v netstat >/dev/null 2>&1; then
            ! netstat -tuln | grep -q ":$port "
        elif command -v nc >/dev/null 2>&1; then
            ! nc -z localhost $port >/dev/null 2>&1
        else
            echo "⚠️  Не найдено ни ss, ни netstat, ни nc."
            exit 1
        fi
    fi
}

find_free_port() {
  local default_port=$1
  local port=$default_port
  while ! is_port_free $port; do
    port=$((port + 1))
  done
  echo $port
}

generate_sha256() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | sha256sum | awk '{print $1}'
  fi
}

# ===== Определяем локальный IP =====
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    LOCAL_IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -n 1)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# ===== Назначаем безопасные порты >1024 =====
BACKEND_PORT=$(find_free_port 8082)
FRONTEND_PORT=$(find_free_port 3000)
POSTGRES_PORT=$(find_free_port 5433)
JWT_SECRET=$(generate_sha256)
JWT_EXPIRATION=86400000

echo "✅ Назначены порты:"
echo "Backend: $BACKEND_PORT"
echo "Frontend: $FRONTEND_PORT"
echo "Postgres: $POSTGRES_PORT"
echo "JWT_SECRET: $JWT_SECRET"
echo "LOCAL_IP: $LOCAL_IP"

# ===== Создание или обновление .env =====
cat > .env <<EOF
# ==== Порты ====
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
POSTGRES_PORT=$POSTGRES_PORT

# ==== PostgreSQL ====
POSTGRES_DB=crashpusher
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# ==== Spring Boot ====
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:${POSTGRES_PORT}/crashpusher
SPRING_DATASOURCE_USERNAME=\${POSTGRES_USER}
SPRING_DATASOURCE_PASSWORD=\${POSTGRES_PASSWORD}
SERVER_PORT=$BACKEND_PORT
CORS_ORIGIN=http://${LOCAL_IP}:${FRONTEND_PORT}
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=$JWT_EXPIRATION
FILE_UPLOAD_DIR=uploads

# ==== Бот ====
BOT_TOKEN=your-token-here
BOT_CHANNEL_FEEDBACK=crushes
BOT_CHANNEL_URL=crushlogger

# ==== Фронтенд ====
VITE_API_BASE=http://${LOCAL_IP}:${BACKEND_PORT}/api
EOF

echo "🎯 .env готов! Теперь запускай:"
echo "docker compose up -d --build"
