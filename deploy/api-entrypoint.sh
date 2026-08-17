#!/bin/sh
set -e

cd /app/apps/api

if [ "$RUN_MIGRATIONS" != "false" ]; then
  echo "Migratsiyalar ishga tushmoqda..."
  npx typeorm migration:run -d dist/src/typeorm.config.js
fi

exec "$@"
