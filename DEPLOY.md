# Serverga chiqarish

Server: `194.107.115.112` · domen: `aihamroh.uz` · Docker va nginx allaqachon o'rnatilgan.
Barcha konteynerlar `127.0.0.1` ga bog'lanadi, tashqariga faqat hostdagi nginx chiqaradi.

## 1. Kodni olish

```bash
sudo mkdir -p /srv/hamroh && sudo chown $USER /srv/hamroh
git clone https://github.com/Uzprogers/hamroh_ai.git /srv/hamroh/app
cd /srv/hamroh/app
```

Keyingi safar yangilash uchun: `cd /srv/hamroh/app && git pull`.

## 2. Kalitlar

Yandex nutq xizmatining kalit faylini serverga o'zingiz yuklaysiz:

```bash
mkdir -p /srv/hamroh/secrets
chmod 700 /srv/hamroh/secrets
# key.json ni shu papkaga qo'ying
chmod 600 /srv/hamroh/secrets/key.json
```

`.env` faylini namunadan tuzing va to'ldiring:

```bash
cp deploy/env.prod.example .env
nano .env
```

To'ldirilishi shart: `POSTGRES_PASSWORD`, `JWT_SECRET`, `LLM_API_KEY`, `YX_FOLDER_ID`,
`GOOGLE_CLIENT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `SIMLI_API_KEY`.
`YANDEX_KEY_PATH` `/srv/hamroh/secrets/key.json` bo'lib qoladi.

## 3. Ishga tushirish

```bash
docker compose up -d --build
docker compose logs -f api
```

Migratsiyalar konteyner ichida avtomatik bajariladi. Web `127.0.0.1:8210` da turadi.

## 4. Nginx va SSL

```bash
sudo cp deploy/nginx-map-upgrade.conf /etc/nginx/conf.d/upgrade-map.conf
sudo cp deploy/nginx-aihamroh.conf /etc/nginx/sites-available/aihamroh.uz
sudo ln -s /etc/nginx/sites-available/aihamroh.uz /etc/nginx/sites-enabled/
sudo certbot certonly --webroot -w /var/www/html -d aihamroh.uz -d www.aihamroh.uz
sudo nginx -t && sudo systemctl reload nginx
```

`upgrade-map.conf` da `$connection_upgrade` allaqachon boshqa loyihada e'lon qilingan bo'lsa,
bu faylni ko'chirmang — nginx takroriy `map` dan xato beradi.

## 5. Demo ma'lumotini yuklash

Bir marta ishlatiladi. Maktab, 3 sinf, 3 fan, 9 guruh, 45 dars, 35 o'quvchi va natijalar quyiladi:

```bash
docker compose run --rm api node dist/scripts/seed-school.js
```

Skript takroran ishga tushsa mavjud yozuvlarni ikkilantirmaydi.

## 6. Ustoz akkaunti

Seed `+998905173007` raqamiga ustoz akkaunti ochadi. Shu raqamga bog'langan hisobga
**Telegram orqali** kiring — Telegram raqam bo'yicha mavjud akkauntga ulanadi.
Google orqali kirsangiz alohida yangi akkaunt ochiladi va sinflar ko'rinmaydi.

## 7. Tashqi xizmatlar

- Google Cloud Console → OAuth client → Authorized JavaScript origins ga `https://aihamroh.uz` qo'shiladi.
- Telegram botda webhook o'rnatilmagan bo'lsin: server `getUpdates` bilan tinglaydi.

## Yangilash

```bash
cd /srv/hamroh/app
git pull
docker compose up -d --build
```

## Zaxira

```bash
docker compose exec db pg_dump -U hamroh hamroh | gzip > /srv/hamroh/backup-$(date +%F).sql.gz
```
