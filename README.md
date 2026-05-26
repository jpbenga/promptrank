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

## Tests et vérification
La base de test est séparée de la base de dev :
- `DATABASE_URL` pointe la base locale de développement.
- `TEST_DATABASE_URL` pointe la base utilisée par les tests d'intégration.
- `.env.example` fournit `TEST_DATABASE_URL=postgresql://promptrank:promptrank@localhost:5432/promptrank_test`.

Préparation de la base de test :
```bash
docker compose up -d
pnpm db:test:prepare
```
`pnpm db:test:prepare` crée `promptrank_test` si possible via Docker Compose, puis applique le schéma Prisma avec `prisma db push` sur `TEST_DATABASE_URL`.

Commandes utiles :
```bash
pnpm test              # tests API unitaires + intégration DB, puis tests Angular
pnpm test:api          # prépare la DB de test, puis lance unitaires + intégration backend
pnpm test:web          # tests Angular/Karma
pnpm test:integration  # prépare la DB de test, puis lance l'intégration API Phase 1
pnpm test:e2e          # Playwright, nécessite pnpm dev déjà lancé
pnpm lint
pnpm build
pnpm verify            # commande recommandée avant commit
```

Pour l'E2E Playwright :
```bash
pnpm dev
pnpm test:e2e
```
Le test E2E suppose que PostgreSQL, l'API et Angular sont déjà lancés. Il utilise `backend-nest/test/fixtures/products-phase1.csv`.

## Contrat de non-régression Phase 1 CSV
Les tests verrouillent le périmètre Phase 1 :
- détection de séparateur CSV `;`, `,`, tabulation ;
- parsing UTF-8, champs avec virgules, prix avec point ou virgule ;
- auto-mapping des colonnes produit attendues ;
- validation `title` obligatoire avec code `CSV_MAPPING_MISSING_TITLE` ;
- normalisation `price`, `availability`, `imageUrls`, `tags`, `rawSource` et `attributes` ;
- import API complet d'un fixture de 8 produits ;
- conservation de `couleur`, `matiere`, `capacite` dans `attributes` ;
- affichage frontend des traductions de base, validation formulaire projet et messages mapping ;
- E2E manuel/automatisé du flow CSV complet.

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

## Tailwind CSS
- Le frontend Angular utilise Tailwind CSS `3.4.13`, PostCSS `8.4.47` et Autoprefixer `10.4.20`, avec versions épinglées dans `frontend-angular/package.json`.
- Angular compile `frontend-angular/src/styles.css`, qui contient les directives `@tailwind base`, `@tailwind components` et `@tailwind utilities`.
- `frontend-angular/.postcssrc.json` charge les plugins PostCSS stables `tailwindcss` et `autoprefixer`.
- `frontend-angular/tailwind.config.js` scanne `./src/**/*.{html,ts}` pour générer les classes utilisées dans les templates Angular.
- Aucun CDN Tailwind n'est utilisé.

## CSV size limit
- Variable d'env: `CSV_MAX_FILE_SIZE_MB`.
- Si dépassée: code `CSV_FILE_TOO_LARGE`.

## Redis (statut réel)
Redis est volontairement hors périmètre Phase 1. Il sera introduit plus tard si besoin pour des jobs async.

## Limites actuelles et prochaines phases
- Phase 1 couvre uniquement CSV.
- Hors périmètre: Shopify, prompts IA, analyse IA, scoring, action cards, billing.
- Phase 2 traitera l'extension fonctionnelle après stabilisation.

## Phase 2 - Génération de prompts d'achat (déterministe)
- Génération locale, déterministe, via templates FR/EN (aucune API IA externe).
- Limites demo/local: 5 produits max sélectionnés, 5 prompts max par produit, 25 prompts max par génération.
- Endpoints:
  - `POST /projects/:projectId/prompts/generate`
  - `GET /projects/:projectId/prompts`
  - `GET /projects/:projectId/products/:productId/prompts`
  - `PATCH /projects/:projectId/prompts/:promptId`
  - `DELETE /projects/:projectId/prompts/:promptId` (désactivation logique)
- Non-régression: les tests Phase 1 restent la référence et doivent rester passants.

### Test manuel Phase 2
1. Aller jusqu'à la page produits via le flow CSV Phase 1.
2. Sélectionner jusqu'à 5 produits.
3. Cliquer **Générer des prompts**.
4. Vérifier les badges `status`, `intent`, `source`.
5. Éditer un prompt puis sauvegarder (feedback succès attendu).
6. Désactiver un prompt (il disparaît de la liste active).

### Commandes tests Phase 2
- `pnpm test:api` (unitaires backend + intégrations Phase 1 + Phase 2)
- `pnpm test:web` (tests Angular)
- `pnpm test:e2e` (Playwright, scénario Phase 2 disponible dans `e2e/phase2-prompts.spec.ts`)

## Contrat de non-régression Phase 2
- sélection de produits depuis la table ;
- génération de prompts déterministes sans API IA ;
- édition et désactivation de prompts ;
- respect des limites 5 produits / 5 prompts / 25 total ;
- textes prompts i18n FR/EN ;
- non-régression des tests Phase 1 (CSV) conservée.

## Phase 3 — Analyse simulée

Flow: prompts → réponses simulées → analyse déterministe. Cette phase n'appelle aucune API IA réelle (OpenAI/Gemini/Perplexity).

Limites local/demo: 25 prompts max par analyse.

### Dette technique
- E2E Phase 2 complet à renforcer plus tard.
- E2E Phase 3 complet à envisager après stabilisation.
