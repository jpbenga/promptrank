# PromptRank - Phase 7A Shopify mock connector

## État des phases
- Phase 1 — CSV import / mapping / produits normalisés : validée.
- Phase 2 — Génération de prompts : validée.
- Phase 3 — Analyse simulée : validée.
- Phase 4 — Scoring de visibilité : validée.
- Phase 5 — Recommandations / action cards : validée.
- Phase 6 — Abstraction providers IA : validée, mock par défaut, OpenAI optionnel désactivé par défaut.
- Phase 7A — Connecteur Shopify mock : préparé, import produit mock local, aucun appel Shopify réel par défaut.

Le projet fonctionne encore sans API IA réelle et sans appel Shopify réel par défaut. Le provider IA `mock` reste le chemin par défaut, OpenAI ne peut être appelé que si le backend est explicitement configuré avec `AI_REAL_PROVIDERS_ENABLED=true` et `OPENAI_API_KEY`, et Shopify reste en `SHOPIFY_SYNC_MODE=mock` tant que `SHOPIFY_REAL_SYNC_ENABLED` n’est pas activé. `pnpm verify` couvre les tests principaux, tandis que les E2E complets restent hors critère bloquant pour l’instant.

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
pnpm test:integration  # prépare la DB de test, puis lance l'intégration API Phases 1 à 7A
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

## Configuration IA
Variables backend:
- `AI_PROVIDER_DEFAULT=mock`: provider utilisé quand l’API ne reçoit pas de provider explicite.
- `AI_REAL_PROVIDERS_ENABLED=false`: garde-fou global. Tant que cette valeur n’est pas `true`, aucun provider réel n’est appelé.
- `OPENAI_API_KEY=`: clé OpenAI côté backend uniquement, jamais exposée au frontend.
- `OPENAI_MODEL=gpt-4.1-mini`: modèle demandé si OpenAI est activé.
- `AI_REQUEST_TIMEOUT_MS=15000`: timeout des requêtes provider.
- `AI_MAX_PROMPTS_PER_RUN=25`: limite de prompts par analyse.

Les tests mockent les providers et ne font aucun appel réseau réel.

## Configuration Shopify
Variables backend:
- `SHOPIFY_SYNC_MODE=mock`: mode utilisé pour la synchronisation Shopify locale.
- `SHOPIFY_REAL_SYNC_ENABLED=false`: garde-fou global. Tant que cette valeur n’est pas `true`, aucun appel Shopify réel n’est autorisé.
- `SHOPIFY_API_VERSION=2025-10`: version API prévue pour une future intégration réelle.
- `SHOPIFY_REQUEST_TIMEOUT_MS=15000`: timeout prévu pour une future intégration réelle.

Phase 7A ne demande aucun token Shopify côté frontend et ne stocke aucun token brut. Les tests utilisent le client mock local et ne font aucun appel Shopify ou Internet.

## Redis (statut réel)
Redis est volontairement hors périmètre Phase 1. Il sera introduit plus tard si besoin pour des jobs async.

## Packaging shared-types
`@promptrank/shared-types` est consommé directement depuis `shared-types/src/index.ts` via son `package.json` et le mapping TypeScript frontend. Le dossier `shared-types/dist` n’est pas utilisé au runtime ni par les imports workspace ; il est ignoré et ne doit pas être versionné.

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

Endpoints:
- `POST /projects/:projectId/prompts/analyze`
- `GET /projects/:projectId/prompt-runs`
- `GET /projects/:projectId/prompts/:promptId/runs`
- `GET /projects/:projectId/products/:productId/prompt-runs`

## Phase 4 — Scores de visibilité déterministes

Flow: `PromptRun` simulés → agrégation → score produit → score projet → affichage UI.

Le score Phase 4 est calculé uniquement à partir des analyses simulées persistées en Phase 3. Il ne fait aucun appel IA réel et ne constitue pas encore un scoring IA avancé.

### Formule simple
Chaque run complété reçoit un score borné entre 0 et 100:
- base run complété: `+5`
- marque mentionnée: `+35`
- produit mentionné: `+35`
- position `1`: `+15`, position `2`: `+10`, position `3`: `+5`
- sentiment `positive`: `+10`, `neutral`: `+5`, `negative`: `-10`, `unknown`: `+0`
- concurrents mentionnés: `-2` par concurrent, pénalité maximale `-10`

Le score produit est la moyenne arrondie des runs du produit. Le score projet est la moyenne arrondie des scores produits.

Métriques calculées:
- prompts analysés;
- taux de mention marque, produit et concurrents, retournés entre `0` et `1`;
- position moyenne;
- sentiment dominant;
- top concurrents triés par fréquence.

Endpoints:
- `POST /projects/:projectId/scores/compute`
- `GET /projects/:projectId/scores`
- `GET /projects/:projectId/scores/project`
- `GET /projects/:projectId/products/:productId/score`

Erreurs structurées:
- `PROJECT_NOT_FOUND`
- `SCORE_NO_PROMPT_RUNS`
- `SCORE_COMPUTE_FAILED`

Tests Phase 4:
- unitaires backend: formule et agrégations dans `backend-nest/src/scores/__tests__/scores.service.spec.ts`;
- intégration backend: `backend-nest/test/phase4.visibility-scores.integration.spec.ts`, inclus dans `pnpm test:integration` et donc dans `pnpm verify`;
- Angular: bouton de calcul, loading, scores, pourcentages, concurrents et erreur traduite.

## Phase 5 — Recommandations et action cards déterministes

Flow: `VisibilityScore` + signaux simulés → recommandations déterministes → action cards → statut utilisateur.

Les recommandations Phase 5 sont calculées localement à partir des scores Phase 4. Elles ne font aucun appel IA réel, ne lancent aucune action automatiquement et ne couvrent pas Shopify, billing, scraping ou génération SEO avancée.

Règles principales:
- score produit faible: action prioritaire pour enrichir la fiche produit;
- marque peu mentionnée: action `brand`;
- produit peu mentionné: action `title` ou `description`;
- concurrents très présents: action comparative;
- sentiment négatif ou neutre: action sur preuves, bénéfices et différenciants;
- position moyenne faible: action sur les signaux de pertinence;
- score projet faible: action globale projet.

Limites de génération:
- 5 action cards maximum par produit;
- 30 action cards maximum par projet;
- déduplication exacte par `projectId`, `productId`, `category`, `reason`;
- statut initial `open`.

Endpoints:
- `POST /projects/:projectId/action-cards/generate`
- `GET /projects/:projectId/action-cards`
- `GET /projects/:projectId/products/:productId/action-cards`
- `PATCH /projects/:projectId/action-cards/:actionCardId`

Erreurs structurées:
- `PROJECT_NOT_FOUND`
- `ACTION_CARDS_NO_SCORES`
- `ACTION_CARD_NOT_FOUND`
- `ACTION_CARD_UPDATE_INVALID`
- `ACTION_CARDS_GENERATION_FAILED`

Tests Phase 5:
- unitaires backend: règles de recommandations dans `backend-nest/src/action-cards/__tests__/action-cards.service.spec.ts`;
- intégration backend: `backend-nest/test/phase5.action-cards.integration.spec.ts`, inclus dans `pnpm test:integration` et donc dans `pnpm verify`;
- Angular: génération, loading, cards, priorité, impact, effort, catégorie, statut done/dismissed et erreur traduite.

## Phase 6 — Abstraction providers IA

Flow: prompt → provider IA sélectionné → réponse provider → analyse déterministe → scores → action cards.

Providers disponibles:
- `mock`: local, déterministe, provider par défaut.
- `openai`: optionnel, désactivé par défaut, configuré uniquement côté backend.

`POST /projects/:projectId/prompts/analyze` accepte maintenant un champ optionnel:
```json
{
  "promptIds": ["..."],
  "provider": "mock"
}
```

Règles:
- provider absent: `AI_PROVIDER_DEFAULT`, ou `mock` par défaut ;
- `provider=mock`: aucun appel IA réel ;
- `provider=openai` avec `AI_REAL_PROVIDERS_ENABLED` différent de `true`: `AI_PROVIDER_DISABLED` ;
- `provider=openai` sans `OPENAI_API_KEY`: `AI_PROVIDER_NOT_CONFIGURED` ;
- provider inconnu: `AI_PROVIDER_UNSUPPORTED` ;
- timeout: `AI_PROVIDER_TIMEOUT` ;
- erreur provider: `AI_PROVIDER_REQUEST_FAILED`.

OpenAI est préparé avec `fetch` natif, mais aucun appel réel n’est requis pour lancer l’application ou `pnpm verify`. Gemini, Perplexity, scraping, billing et scoring IA avancé restent hors périmètre.

Tests Phase 6:
- unitaires backend: orchestration provider, OpenAI désactivé/non configuré, timeout, erreurs, absence de logs de clé ;
- intégration backend: `backend-nest/test/phase6.ai-providers.integration.spec.ts`, inclus dans `pnpm test:integration` et `pnpm verify`;
- Angular: choix provider, provider mock par défaut, provider envoyé à l’API, erreurs traduites et absence de champ clé API.

## Phase 7A — Connecteur Shopify mock

Flow visé: Shopify mock → produits normalisés → prompts → analyse → scores → action cards.

La Phase 7A prépare l’architecture Shopify sans OAuth complet, sans webhooks, sans synchronisation automatique planifiée, sans publication ou modification de produits Shopify, et sans billing. Le CSV reste supporté et inchangé.

Comportement:
- l’utilisateur configure une connexion Shopify mockée par projet;
- la synchronisation utilise `MockShopifyClient`, déterministe et local;
- les produits Shopify mockés sont normalisés dans `Product` avec `source=shopify`;
- les champs utiles sont conservés: SKU, marque/vendor, catégorie/product_type, prix, devise, disponibilité, stock, URL, images, tags, GTIN et `rawSource`;
- les produits importés sont compatibles avec les Phases 2 à 6.

Endpoints:
- `POST /projects/:projectId/shopify/config`
- `GET /projects/:projectId/shopify/status`
- `POST /projects/:projectId/shopify/sync`

Exemple config:
```json
{
  "shopDomain": "demo.myshopify.com",
  "mode": "mock"
}
```

Erreurs structurées:
- `PROJECT_NOT_FOUND`
- `SHOPIFY_INVALID_DOMAIN`
- `SHOPIFY_REAL_SYNC_DISABLED`
- `SHOPIFY_CONNECTION_NOT_FOUND`
- `SHOPIFY_SYNC_FAILED`

Tests Phase 7A:
- unitaires backend: validation domaine, config mock, refus du mode réel désactivé, client mock, normalisation, création/mise à jour produits et absence de token brut;
- intégration backend: `backend-nest/test/phase7.shopify.integration.spec.ts`, inclus dans `pnpm test:integration` et `pnpm verify`;
- Angular: section Shopify, mode mock, formulaire domaine, actions config/sync, compteurs et erreur traduite.

## Dettes techniques connues
- Renforcer les E2E complets Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7A.
- Surveiller la stratégie `shared-types/dist` : la stratégie actuelle est source-first, avec `dist` ignoré.
- Améliorer progressivement la séparation frontend : `frontend-angular/src/app/app.component.ts` concentre beaucoup de logique applicative.
- Garder le provider mock comme fallback obligatoire avant toute IA réelle.
