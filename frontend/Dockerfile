FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE=http://localhost:8081/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN node ./node_modules/vite/bin/vite.js build

FROM nginx:alpine
RUN apk add --no-cache gettext

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf.template

CMD ["/bin/sh", "-c", "envsubst 'FRONTEND_PORT BACKEND_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]