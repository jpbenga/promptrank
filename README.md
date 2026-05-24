# PromptRank - Phase 1 CSV

## Versions stables/LTS
- Node.js 22 LTS
- pnpm 9.12.3
- Angular 18.2.x
- NestJS 10.4.x
- Prisma 5.20.x
- PostgreSQL 16.x
- CI runner: `ubuntu-24.04` (pas de `latest`)

## Démarrage local
```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

## Flux CSV UI (Phase 1)
1. Ouvrir l'accueil, cliquer **Créer un projet**.
2. Remplir `name`, `primaryLanguage`, `targetCountry`, `currency`.
3. Upload `samples/products-demo.csv`.
4. Vérifier preview (delimiter, colonnes, 20 lignes max).
5. Continuer vers mapping, vérifier `title` obligatoire.
6. Importer les produits.
7. Vérifier la table produits normalisés.

## Flux API rapide
- `GET /health`
- `POST /projects`
- `POST /projects/:id/csv/upload`
- `POST /projects/:id/csv/mapping`
- `POST /projects/:id/csv/import`
- `GET /projects/:id/products`

## i18n FR/EN
- Sélecteur langue dans le layout (FR/EN).
- Tous les textes visibles passent via `frontend-angular/src/assets/i18n/fr.json` / `en.json`.
- Mapping des codes erreurs backend vers messages traduits côté frontend.

## CSV size limit
- Variable d'env: `CSV_MAX_FILE_SIZE_MB`.
- Si dépassée: code `CSV_FILE_TOO_LARGE`.

## Redis (statut réel)
Redis est volontairement hors périmètre Phase 1. Il sera introduit plus tard si besoin pour des jobs async.

## Limites actuelles et prochaines phases
- Phase 1 couvre uniquement CSV.
- Hors périmètre: Shopify, prompts IA, analyse IA, scoring, action cards, billing.
- Phase 2 traitera l'extension fonctionnelle après stabilisation.
