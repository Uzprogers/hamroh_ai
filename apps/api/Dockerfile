FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts scripts
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=@hamroh/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace=@hamroh/api

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts scripts
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace=@hamroh/api --include-workspace-root && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/fixtures apps/api/dist/fixtures
COPY deploy/api-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
WORKDIR /app/apps/api
EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
