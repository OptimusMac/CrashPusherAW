FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./

# Устанавливаем devDependencies (vite входит сюда)
RUN npm ci --include=dev

COPY . .

ARG VITE_API_BASE=http://localhost:8081/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN echo "🔄 Building with VITE_API_BASE: $VITE_API_BASE"

# Запуск сборки через npm run
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE ${FRONTEND_PORT}
CMD ["/docker-entrypoint.sh"]
