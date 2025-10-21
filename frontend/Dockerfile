# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Устанавливаем зависимости для сборки
COPY package*.json ./

# Лучше использовать npm ci для чистой установки devDependencies
RUN echo "Installing dependencies at $(date)" && npm ci

# Копируем весь фронтенд
COPY . .

# Передаём переменную окружения в Vite
ARG VITE_API_BASE=http://localhost:8081/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN echo "🔄 Building with VITE_API_BASE: $VITE_API_BASE"

# Проверяем наличие vite
RUN ls -la node_modules/.bin/vite || echo "Vite not found in node_modules"

# Собираем фронтенд напрямую через node
RUN node ./node_modules/vite/bin/vite.js build

# -----------------------------
# Stage 2: Production
# -----------------------------
FROM nginx:alpine
RUN apk add --no-cache gettext

# Копируем только собранный фронтенд, node_modules не нужны
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE ${FRONTEND_PORT}
CMD ["/docker-entrypoint.sh"]
