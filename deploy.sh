#!/bin/bash
# PioneerCY Production Deploy Script
# Ubuntu/Debian VPS için

set -e

echo "=== PioneerCY Deploy Başlıyor ==="

# Node.js kur (eğer yoksa)
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# PM2 kur (process manager)
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Bağımlılıkları kur
npm install

# Prisma generate ve migrate
npx prisma generate
npx prisma migrate deploy

# Eğer ilk kurulum ise seed çalıştır
if [ "$1" == "--seed" ]; then
  npx tsx prisma/seed.ts
fi

# Build al
npm run build

# PM2 ile başlat/yeniden başlat
pm2 describe pioneercy > /dev/null 2>&1 && pm2 restart pioneercy || pm2 start npm --name "pioneercy" -- start -- -p 3000

pm2 save

echo "=== Deploy Tamamlandı! ==="
echo "Site: http://localhost:3000"
echo "Admin: http://localhost:3000/admin/login"
