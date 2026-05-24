# PromptRank - Phase 1 CSV MVP

Monorepo TypeScript avec Angular + NestJS. Objectif: upload CSV, preview, mapping, normalisation, import en base et affichage.

## Stack & versions stables
- Node.js 22 LTS
- pnpm 9.12.3
- TypeScript 5.6.x
- Angular 18.2.x (stable)
- NestJS 10.4.x (stable)
- Prisma 5.20.x (stable)
- PostgreSQL 16.4 (stable)
- Tailwind CSS 3.4.x (stable)

Ces versions sont LTS/stables, compatibles Angular/Nest/Prisma et maintenues.

## Architecture
- `frontend-angular/` UI Angular + Tailwind + ngx-translate (fr par défaut, en supporté)
- `backend-nest/` API NestJS + Prisma + PostgreSQL
- `shared-types/` types partagés
- `samples/products-demo.csv`

## i18n
- Frontend: `ngx-translate`, fichiers `fr.json` et `en.json`, langue persistée en `localStorage`.
- Backend: erreurs API structurées par code stable (`CSV_INVALID_FILE_TYPE`, etc.).

## Setup
```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Flux CSV
1. Créer projet: `POST /projects`
2. Upload CSV: `POST /projects/:id/csv/upload` (`file` multipart)
3. Mapping: `POST /projects/:id/csv/mapping`
4. Import: `POST /projects/:id/csv/import`
5. Lister produits: `GET /projects/:id/products`

## Hors périmètre volontaire
Shopify, OAuth, IA/scoring/prompts, billing, action cards.
