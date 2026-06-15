# TigerPingPong Local Startup

Start the app:

cd ~/Code/tigerpingpong-platform
pnpm dlx dotenv-cli -e .env -- pnpm dev

Frontend:
http://localhost:3000

API:
http://localhost:3001

API health check:
http://localhost:3001/catalog/health

Important:
.env and apps/api/.env contain secrets and should never be committed.

Do not run these against the cloud database unless you intentionally want to change real data:
pnpm prisma migrate dev
pnpm prisma db push
pnpm prisma db seed