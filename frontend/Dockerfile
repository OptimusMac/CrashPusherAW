FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod -R 755 node_modules/.bin

# 👇 ПЕРЕДАЕМ ПЕРЕМЕННЫЕ ПРИ БИЛДЕ
ARG VITE_API_BASE=http://localhost:8081/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN echo "🔄 Building with VITE_API_BASE: $VITE_API_BASE"

RUN npm run build

FROM nginx:alpine

# Устанавливаем envsubst
RUN apk add --no-cache gettext

# Копируем билд
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем шаблон nginx конфига
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Копируем скрипт запуска
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE ${FRONTEND_PORT}

CMD ["/docker-entrypoint.sh"]