FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts scripts
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
RUN npm ci
COPY apps/web apps/web
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_SIMLI_API_KEY
ARG VITE_SIMLI_FACE_ID
RUN npm run build --workspace=@hamroh/web

FROM nginx:1.27-alpine
COPY deploy/web-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
