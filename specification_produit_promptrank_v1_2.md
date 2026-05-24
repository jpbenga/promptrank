# Spécification produit — PromptRank

**Nom de travail :** PromptRank  
**Version du document :** 1.2  
**Date :** 24 mai 2026  
**Auteur / contexte :** projet solo développeur — micro-SaaS / plugin e-commerce  
**Décision technique majeure :** full Angular côté frontend, Tailwind CSS côté UI, NestJS côté backend, avec versions LTS/stables uniquement.  
**Décision produit majeure :** démarrer par le mode CSV-first, avec internationalisation français/anglais dès la Phase 1, puis ajouter le connecteur Shopify.  

---

## 1. Résumé exécutif

PromptRank est une application SaaS destinée aux petites boutiques e-commerce, freelances, agences et marchands indépendants. Son objectif est de mesurer et améliorer la visibilité des produits dans les réponses d’achat générées par les IA : ChatGPT, Gemini, Perplexity, Copilot et autres moteurs conversationnels.

L’application ne remplace pas Channable, Lengow, Productsup, Feedonomics, Akeneo, Salsify ou un autre outil de feed/PIM. Elle se positionne sur une promesse beaucoup plus étroite :

> **Identifier les requêtes d’achat IA sur lesquelles un produit devrait apparaître mais n’apparaît pas, puis proposer des optimisations de fiche produit validables par l’humain.**

La première version doit rester très simple et réaliste pour un solo développeur.

Dès la première version exploitable, PromptRank doit être conçu comme un produit internationalisable. La V1 doit donc proposer au minimum une interface en **français** et en **anglais**, sans textes d’interface codés en dur dans les composants.

Le produit final doit pouvoir fonctionner sous deux formes :

1. **Application SaaS standalone** : l’utilisateur importe un fichier CSV de produits.
2. **Plugin / app Shopify embedded** : l’utilisateur connecte sa boutique Shopify et récupère automatiquement ses produits.

À terme, la même architecture doit permettre d’ajouter WooCommerce, Wix, BigCommerce, Channable, Google Merchant Center ou d’autres connecteurs.

Le cœur du produit doit donc être indépendant de la source de données.

```text
CSV                ┐
Shopify            ├── PromptRank Core ── Analyse IA ── Action Cards ── Validation humaine
WooCommerce futur  ┘
```

---

## 2. Proposition de valeur

### 2.1 Proposition simple

> **Le SEO checker pour les réponses IA shopping.**

### 2.2 Proposition orientée petits marchands

> **Découvrez pourquoi ChatGPT, Gemini ou Perplexity recommandent vos concurrents plutôt que vos produits.**

### 2.3 Proposition orientée Shopify

> **Connectez votre boutique, choisissez vos produits, découvrez les requêtes IA où ils sont invisibles, puis appliquez les corrections recommandées après validation.**

### 2.4 Proposition orientée freelance / consultant

> **Importez le catalogue CSV d’un client, générez un audit de visibilité IA et exportez des recommandations concrètes à appliquer dans sa boutique.**

---

## 3. Périmètre strict du MVP

PromptRank V1 ne doit faire qu’une seule boucle :

```text
Produit → Prompts d’achat IA → Test de visibilité → Diagnostic → Action Cards → Validation humaine → Export
```

La V1 ne doit pas devenir :

- un produit mono-langue difficile à adapter à l’international ;
- un projet basé sur des versions techniques `latest` non-LTS ou expérimentales ;
- un feed manager complet ;
- un PIM ;
- un CMS ;
- un outil SEO généraliste ;
- un outil de génération massive de blogs ;
- un scraper massif de ChatGPT ;
- une plateforme enterprise type Profound ;
- une solution de checkout IA ;
- une marketplace ;
- une promesse de ranking garanti.

La promesse doit rester honnête :

> **PromptRank ne garantit pas d’être premier dans ChatGPT. Il mesure, diagnostique, recommande et permet de retester.**

---

## 4. Décision produit : CSV-first puis Shopify

### 4.1 Pourquoi commencer par le CSV

Même si Shopify est stratégique, le mode CSV doit être développé en premier.

Raisons :

1. Il permet de valider la valeur sans dépendre de Shopify.
2. Il évite de commencer par OAuth, App Bridge, permissions, webhooks et contraintes App Store.
3. Il sert aussi les freelances et consultants qui travaillent sur des boutiques clientes.
4. Il permet d’importer des exports venant de Shopify, WooCommerce, Channable, Lengow, Google Merchant Center ou d’un simple ERP.
5. Il force à créer un modèle produit interne générique avant tout connecteur.

Le premier jalon produit doit être :

> **En moins de 10 minutes, un utilisateur importe un CSV et obtient des recommandations concrètes pour améliorer la visibilité IA d’un ou plusieurs produits.**

### 4.2 Pourquoi Shopify vient ensuite

Shopify doit être le premier connecteur natif car :

- beaucoup de petites boutiques et dropshippers l’utilisent ;
- l’écosystème d’apps est mature ;
- les produits sont accessibles via l’Admin API ;
- l’app peut être intégrée dans l’admin Shopify ;
- Shopify fournit des development stores pour tester.

Le connecteur Shopify doit d’abord être limité à :

1. installer l’app ;
2. récupérer les produits ;
3. envoyer les produits au même moteur PromptRank que le CSV ;
4. afficher les recommandations ;
5. appliquer une modification uniquement après validation humaine.

---

## 5. Architecture fonctionnelle cible

### 5.1 Vue globale

```text
Utilisateur standalone
        │
        ├── Upload CSV
        │
        ▼
Application Angular + Tailwind
        │
        ▼
Backend NestJS
        │
        ├── CSV Connector
        ├── Shopify Connector
        ├── Product Normalizer
        ├── Prompt Generator
        ├── AI Visibility Tester
        ├── Scoring Engine
        ├── Recommendation Engine
        ├── Human Review Workflow
        └── Export Engine
        │
        ▼
PostgreSQL + stockage fichiers
        │
        ▼
OpenAI API / Gemini API / Perplexity API
```

### 5.2 Modes d’entrée

#### Mode 1 — CSV standalone

L’utilisateur :

1. crée un compte PromptRank ;
2. importe un CSV ;
3. mappe les colonnes ;
4. sélectionne des produits ;
5. lance une analyse ;
6. reçoit des action cards ;
7. exporte les recommandations.

#### Mode 2 — Shopify embedded app

Le marchand :

1. installe l’app depuis une URL privée ou plus tard depuis l’App Store Shopify ;
2. autorise les scopes nécessaires ;
3. sélectionne les produits à analyser ;
4. lance une analyse ;
5. valide/modifie/refuse les recommandations ;
6. applique les modifications dans Shopify ou exporte les recommandations.

### 5.3 Point fondamental

Le mode CSV et le mode Shopify ne doivent pas être deux produits différents.

Ils doivent seulement être deux connecteurs vers le même moteur.

```text
CSV row           → NormalizedProduct
Shopify Product   → NormalizedProduct
WooCommerce futur → NormalizedProduct
Wix futur         → NormalizedProduct
```

Tout ce qui vient après doit être identique.

---

## 6. Stack technique retenue

### 6.0 Contraintes de versions techniques

PromptRank doit privilégier des versions **LTS**, **stables** et **maintenues**.

Règles :

- ne pas utiliser de versions `latest` dans les fichiers Docker, CI ou documentation ;
- ne pas utiliser de version preview, bêta, alpha ou release candidate ;
- utiliser des tags explicites pour les images Docker ;
- documenter les versions retenues dans le `README.md` ;
- choisir des dépendances maintenues, compatibles avec Angular et NestJS ;
- éviter les bibliothèques expérimentales si une solution stable existe.

Versions à privilégier au démarrage :

```text
Node.js       : LTS active, par exemple Node 22 LTS si compatible
Angular       : version stable maintenue, pas de preview/RC
NestJS        : version stable maintenue
TypeScript    : version stable compatible Angular/NestJS
PostgreSQL    : version stable maintenue, par exemple 16 ou 17
Redis         : version stable maintenue si utilisé
Prisma        : version stable maintenue
Tailwind CSS  : version stable compatible Angular
pnpm          : version stable
```

Le choix exact des versions doit être validé au moment de l’implémentation, mais le principe reste : **stabilité avant nouveauté**.

### 6.1 Frontend

**Technologie :** Angular  
**UI :** Tailwind CSS  
**Composants :** composants Angular maison, stylés avec Tailwind.  
**Pourquoi pas React ?** Shopify propose beaucoup d’exemples React/React Router, mais une app Shopify embedded reste une application web hébergée par le développeur. Angular peut être utilisé avec Shopify App Bridge JavaScript.

Le frontend doit gérer :

- le mode standalone CSV ;
- le mode Shopify embedded ;
- les écrans communs : produits, prompts, score, action cards, validation, export ;
- les layouts différents entre standalone et Shopify.

Structure recommandée :

```text
apps/frontend-angular/
├── src/app/
│   ├── core/
│   │   ├── auth/
│   │   ├── api/
│   │   └── guards/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── product-table/
│   │   │   ├── visibility-score/
│   │   │   ├── action-card/
│   │   │   ├── prompt-list/
│   │   │   └── review-panel/
│   │   └── models/
│   ├── standalone/
│   │   ├── csv-upload/
│   │   ├── csv-mapping/
│   │   └── project-dashboard/
│   ├── shopify/
│   │   ├── shopify-layout/
│   │   ├── product-import/
│   │   └── shopify-review/
│   └── analysis/
│       ├── analysis-run/
│       ├── results/
│       └── recommendations/
```

### 6.2 Backend

**Technologie :** NestJS  
**Langage :** TypeScript  
**Base :** PostgreSQL  
**ORM :** Prisma  
**Jobs async :** BullMQ + Redis, ou Trigger.dev / Inngest si tu veux réduire l’infra.  
**Stockage CSV :** Cloudflare R2, S3, Supabase Storage ou stockage local en développement.

Structure recommandée :

```text
apps/api-nest/
├── src/
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── products/
│   ├── connectors/
│   │   ├── csv/
│   │   └── shopify/
│   ├── ai/
│   │   ├── openai/
│   │   ├── gemini/
│   │   └── perplexity/
│   ├── prompt-generator/
│   ├── visibility-analysis/
│   ├── scoring/
│   ├── recommendations/
│   ├── exports/
│   ├── jobs/
│   └── billing/
```

### 6.3 Monorepo recommandé

Pour un solo développeur, deux options sont possibles.

#### Option simple

```text
promptrank/
├── frontend-angular/
├── backend-nest/
└── shared-types/
```

#### Option plus structurée avec Nx

```text
promptrank/
├── apps/
│   ├── frontend-angular/
│   └── api-nest/
├── libs/
│   ├── shared-types/
│   ├── product-core/
│   ├── i18n/
│   └── test-utils/
```

Si tu connais Nx, c’est très adapté à Angular + NestJS. Sinon, commence simple avec deux dossiers.

---

## 7. Internationalisation

### 7.1 Langues obligatoires

PromptRank doit être disponible dès la Phase 1 en :

```text
fr : français
en : anglais
```

La langue par défaut est le **français**.

### 7.2 Règles frontend

Tous les textes visibles dans l’interface doivent passer par un système d’internationalisation.

Règles :

- aucun texte utilisateur ne doit être codé en dur dans les composants Angular ;
- les labels, boutons, titres, placeholders, messages d’erreur, états vides et états de chargement doivent être traduits ;
- les fichiers de traduction doivent au minimum couvrir `fr` et `en` ;
- un sélecteur de langue simple `FR / EN` doit être présent dans l’interface ;
- la langue choisie doit être persistée localement, par exemple dans `localStorage` ;
- l’architecture doit permettre d’ajouter d’autres langues sans refonte majeure.

Exemples de fichiers attendus :

```text
frontend-angular/src/assets/i18n/fr.json
frontend-angular/src/assets/i18n/en.json
```

ou, dans une structure Nx :

```text
apps/frontend-angular/src/assets/i18n/fr.json
apps/frontend-angular/src/assets/i18n/en.json
libs/i18n/
```

### 7.3 Règles backend

Le backend doit retourner des erreurs structurées avec des codes stables indépendants de la langue.

Exemple :

```json
{
  "code": "CSV_INVALID_FILE_TYPE",
  "message": "Only CSV files are accepted"
}
```

Le frontend doit traduire les erreurs connues à partir de leur `code`.

Codes d’erreur initiaux recommandés :

```text
CSV_INVALID_FILE_TYPE
CSV_FILE_TOO_LARGE
CSV_PARSE_ERROR
CSV_EMPTY_FILE
CSV_NO_COLUMNS_FOUND
CSV_MAPPING_MISSING_TITLE
PROJECT_NOT_FOUND
PRODUCT_IMPORT_FAILED
```

### 7.4 Écrans concernés dès la Phase 1

Les écrans suivants doivent être disponibles en français et en anglais :

- accueil ;
- création de projet ;
- upload CSV ;
- prévisualisation CSV ;
- mapping des colonnes ;
- table des produits normalisés ;
- messages d’erreur ;
- états `loading`, `empty`, `success` et `error`.

---

## 8. Modèle produit interne

Le modèle interne est la pièce la plus importante pour éviter la duplication.

```ts
type NormalizedProduct = {
  id: string;
  source: 'csv' | 'shopify' | 'woocommerce' | 'wix';
  sourceAccountId?: string;
  externalId?: string;
  sku?: string;
  title: string;
  description?: string;
  brand?: string;
  vendor?: string;
  productType?: string;
  category?: string;
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stockQuantity?: number;
  url?: string;
  imageUrls?: string[];
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  gtin?: string;
  rating?: number;
  reviewsCount?: number;
  attributes?: Record<string, string>;
  rawSource?: unknown;
};
```

### 7.1 Règle d’or

Aucune fonctionnalité IA ne doit dépendre directement d’un `ShopifyProduct` ou d’une ligne CSV brute.

Tout doit passer par `NormalizedProduct`.

```text
CSV brut → CSV Connector → NormalizedProduct → PromptRank Core
Shopify brut → Shopify Connector → NormalizedProduct → PromptRank Core
```

---

## 9. Fonctionnalités du MVP CSV-first

### 8.1 Création d’un projet

Un utilisateur peut créer un projet :

```text
Nom du projet : Boutique gourdes client X
Source : CSV
Langue principale : Français
Pays cible : France
Devise : EUR
```

### 8.2 Upload CSV

L’utilisateur importe un fichier `.csv`.

Contraintes V1 :

- taille limitée ;
- encodage UTF-8 recommandé ;
- séparateur détecté automatiquement si possible ;
- prévisualisation des 20 premières lignes ;
- gestion des erreurs lisibles.

### 8.3 Mapping des colonnes

L’application propose un mapping automatique.

Exemple :

```text
nom_produit        → title
prix_ttc           → price
description_longue → description
ean13              → gtin
url_fiche          → url
stock              → availability
```

L’utilisateur peut corriger manuellement.

Champs minimums nécessaires :

```text
title
```

Champs fortement recommandés :

```text
description
price
url
brand/category/product_type
```

### 8.4 Sélection de produits

L’utilisateur sélectionne quelques produits à analyser.

Limites recommandées V1 :

```text
Plan gratuit : 3 à 5 produits
Plan starter : 25 produits
Plan growth : 100 produits
```

### 8.5 Génération de prompts

Pour chaque produit, le système génère entre 5 et 10 prompts d’achat.

Exemple produit :

```text
Gourde inox 750 ml
```

Prompts possibles :

```text
meilleure gourde inox pour le sport
gourde isotherme randonnée pas chère
gourde sans BPA pour enfant
quelle bouteille inox choisir pour garder l’eau froide
alternative moins chère à une gourde Stanley
```

La génération doit être sobre pour limiter les coûts.

### 8.6 Test IA

V1 recommandée : commencer avec 1 ou 2 fournisseurs IA/search.

Ordre conseillé :

1. Perplexity API ou Search API ;
2. Gemini API avec grounding Google Search ;
3. OpenAI API avec web search ;
4. plus tard : tests complémentaires autour de ChatGPT Shopping si une API officielle spécifique existe.

Important : ne pas baser le MVP sur l’automatisation de l’interface chatgpt.com avec Selenium/Playwright pour scraper des réponses. C’est fragile, potentiellement contraire aux conditions d’usage et difficile à maintenir.

### 8.7 Analyse de réponse

Pour chaque réponse IA, détecter :

- le produit est-il cité ?
- la marque est-elle citée ?
- le domaine de la boutique est-il cité ?
- quels concurrents sont cités ?
- quels attributs reviennent dans la réponse ?
- existe-t-il des sources ou liens ?
- la réponse parle-t-elle d’un besoin auquel le produit pourrait répondre ?

### 8.8 Score simple

Ne pas créer un score trop complexe au départ.

```text
AI Visibility Score = 0 à 100
```

Sous-métriques :

```text
Apparition produit : 0/10
Apparition marque : 1/10
Apparition domaine : 0/10
Top concurrents détectés : Decathlon, Amazon, Stanley
```

### 8.9 Action Cards

Les action cards sont le cœur produit.

Exemple :

```text
Action : Ajouter “isotherme” au titre produit
Pourquoi : les prompts liés à “gourde isotherme” recommandent des concurrents, mais votre fiche n’utilise pas ce terme clairement.
Impact estimé : élevé
Risque : faible
Statut : proposée
Actions utilisateur : valider / modifier / refuser
```

Types d’action V1 :

- modifier le titre ;
- enrichir la description ;
- ajouter une FAQ produit ;
- ajouter des attributs ;
- corriger la meta description ;
- ajouter des tags ;
- clarifier l’usage ;
- ajouter une information seulement si elle est vraie.

### 8.10 Export

V1 CSV : export simple.

Formats :

- CSV des recommandations ;
- Markdown ou PDF rapport plus tard ;
- JSON interne pour debug.

Exemple de colonnes exportées :

```text
product_id
sku
title
prompt
current_visibility
recommended_action
suggested_title
suggested_description
reason
impact
risk
status
```

---

## 10. Fonctionnalités du connecteur Shopify

### 9.1 Objectif Shopify V1

Le connecteur Shopify ne doit pas réinventer le produit.

Il doit seulement remplacer l’import CSV par une lecture directe des produits Shopify.

```text
Shopify Product → NormalizedProduct → même analyse que CSV
```

### 9.2 Boutique Shopify de test

Créer au moins trois boutiques de développement réalistes.

#### Boutique 1 — Dropshipping généraliste

Produits :

- gourdes isothermes ;
- lampes LED ;
- accessoires téléphone ;
- sacs de voyage ;
- tapis de yoga ;
- montres sport.

Objectif : tester des produits génériques avec forte concurrence.

#### Boutique 2 — Beauté / cosmétique simple

Produits :

- crème hydratante ;
- sérum visage ;
- shampoing ;
- crème solaire ;
- brosse nettoyante ;
- huile barbe.

Objectif : tester les recommandations prudentes sur des produits où les claims doivent être contrôlés.

#### Boutique 3 — Sport / outdoor

Produits :

- chaussures running ;
- sac de randonnée ;
- veste imperméable ;
- gourde ;
- lampe frontale ;
- tapis de fitness.

Objectif : tester les prompts par usage : sport, randonnée, météo, niveau utilisateur.

### 9.3 Ce que les boutiques de test permettent de tester

Elles permettent de tester :

- installation de l’app ;
- OAuth Shopify ;
- lecture produits ;
- mapping Shopify vers `NormalizedProduct` ;
- interface embedded ;
- sélection produits ;
- analyse IA ;
- action cards ;
- validation humaine ;
- application d’une modification test ;
- rollback d’une modification test.

### 9.4 Ce que les boutiques de test ne prouvent pas

Elles ne prouvent pas qu’un produit fictif va réellement ranker dans ChatGPT ou Gemini.

Une boutique de test n’a pas forcément :

- d’autorité de domaine ;
- d’indexation réelle ;
- d’avis ;
- de backlinks ;
- de flux marchand réellement accepté ;
- de présence sur des sources tierces ;
- d’historique.

La boutique Shopify de test sert à tester l’application logicielle, pas à prouver le ranking IA réel.

Pour prouver la valeur business, il faudra plus tard 2 à 5 boutiques pilotes réelles.

### 9.5 Scopes Shopify V1

Démarrer avec les scopes minimums.

Lecture :

```text
read_products
```

Écriture, seulement quand l’application directe sera ajoutée :

```text
write_products
```

Pour la V1 Shopify, il est possible de commencer sans écriture directe : l’app affiche les recommandations et permet d’exporter.

### 9.6 Application des modifications dans Shopify

À n’ajouter qu’après validation du workflow human-in-the-loop.

Règle :

> Aucune modification automatique sans validation explicite.

Avant modification, stocker l’ancienne valeur pour rollback :

```text
product_id
field_changed
old_value
new_value
validated_by
validated_at
applied_at
rollback_available
```

---

## 11. OpenAI Product Feed / ChatGPT Shopping readiness

### 10.1 Clarification

OpenAI documente des product feeds structurés pour rendre les produits découvrables dans ChatGPT. PromptRank ne doit pas devenir un feed manager complet, mais il doit savoir auditer si les données produit sont compatibles avec ce type d’exigence.

### 10.2 Ce que PromptRank peut faire en V1

V1 : audit de readiness, pas soumission automatique.

Vérifier :

- titre produit clair ;
- description exploitable ;
- URL canonique ;
- prix ;
- devise ;
- disponibilité ;
- image ;
- marque ;
- identifiant produit ;
- GTIN si disponible ;
- catégories ;
- informations vendeur ;
- cohérence entre page produit et catalogue.

### 10.3 Ce que PromptRank peut générer plus tard

V2/V3 : génération d’un export `openai_product_feed_candidate`.

Attention : ce fichier ne garantit pas l’indexation dans ChatGPT. Il sert à aider le marchand à préparer ses données.

### 10.4 Différence entre readiness et ranking

Readiness :

```text
Le produit possède-t-il les informations nécessaires pour être compris par une IA shopping ?
```

Ranking :

```text
Le produit ressort-il réellement dans les réponses d’achat IA ?
```

PromptRank doit couvrir les deux, mais la V1 peut démarrer par :

1. readiness produit ;
2. visibilité via APIs IA/search ;
3. recommandations.

---

## 12. Human-in-the-loop

Le human-in-the-loop est obligatoire.

Chaque recommandation doit avoir un statut :

```text
proposed
accepted
edited
rejected
applied
exported
rolled_back
```

L’utilisateur doit pouvoir :

- valider ;
- modifier ;
- refuser ;
- appliquer à un seul produit ;
- exporter ;
- demander une reformulation ;
- créer une règle simple plus tard.

Exemple :

```text
Recommandation IA : Ajouter “sans BPA” à la description.
Risque : moyen.
Message : cette action ne doit être validée que si l’information est vérifiée.
```

Règle produit :

> L’IA ne doit jamais inventer une propriété produit. Elle peut proposer une formulation uniquement si la donnée existe ou si l’utilisateur la valide.

---

## 13. Environnements

### 12.1 Local

Utilisé pour :

- développement quotidien ;
- tests unitaires ;
- tests d’intégration mockés ;
- mode CSV ;
- connexion à une Shopify dev store via tunnel ;
- essais UI Angular/Tailwind.

Composants :

```text
Angular local
NestJS local
PostgreSQL local via Docker
Redis local via Docker
Stockage fichiers local
Mocks IA
Shopify CLI / tunnel
```

### 12.2 Staging

Utilisé pour :

- tests end-to-end ;
- validation avant production ;
- tests avec boutiques Shopify de développement ;
- tests avec clés API IA de staging ou quotas faibles ;
- tests de migration DB ;
- tests de non-régression.

Le staging doit avoir :

```text
URL publique
base PostgreSQL staging
stockage fichiers staging
clés API séparées si possible
Shopify app config staging
```

### 12.3 Production

Utilisé pour :

- vrais utilisateurs ;
- vrais catalogues ;
- vraies analyses IA ;
- vrais quotas ;
- billing.

La production doit avoir :

```text
monitoring erreurs
logs applicatifs
sauvegardes DB
rate limits
gestion crédits IA
alertes coûts
politique de rétention fichiers
```

### 12.4 Où l’app Shopify est-elle déployée ?

Une app Shopify n’est pas hébergée “dans Shopify”.

Ton app web est hébergée chez toi, par exemple :

- Render ;
- Railway ;
- Fly.io ;
- Heroku ;
- AWS ;
- GCP ;
- Azure ;
- DigitalOcean.

Shopify affiche ton app dans l’admin Shopify via App Bridge / embedded app, mais les pages viennent de ton serveur.

```text
Shopify Admin
    ↓ affiche
Frontend Angular hébergé chez toi
    ↓ appelle
Backend NestJS hébergé chez toi
    ↓ appelle
Shopify Admin API + APIs IA
```

---

## 14. Tests et non-régression

### 14.1 Principe

Les tests doivent protéger le cœur produit :

```text
Import → Normalisation → Prompts → Analyse → Score → Recommandations → Export
```

Les APIs IA doivent être mockées dans les tests automatisés pour éviter :

- coûts ;
- instabilité ;
- lenteur ;
- variations de réponse.

### 14.2 Tests unitaires backend

À écrire dès la Phase 1 :

- parsing CSV ;
- détection séparateur CSV ;
- mapping colonnes ;
- normalisation produit ;
- génération prompts ;
- calcul score ;
- extraction concurrents depuis une réponse mockée ;
- détection marque/produit/domaine ;
- génération action cards ;
- export CSV.

### 14.3 Tests unitaires frontend

À écrire progressivement :

- sélecteur de langue ;
- affichage des traductions françaises ;
- affichage des traductions anglaises ;
- traduction des erreurs API connues ;
- composant upload CSV ;
- composant mapping colonnes ;
- table produits ;
- score card ;
- action card ;
- modal de validation ;
- écran export.

### 14.4 Tests d’intégration

Scénarios :

```text
Upload CSV → produits créés
Produits → prompts générés
Prompts + réponses IA mockées → score calculé
Score → action cards générées
Action cards → export CSV
```

### 14.5 Tests end-to-end Playwright

Scénario E2E V1 CSV :

```text
1. L’utilisateur se connecte.
2. Il crée un projet.
3. Il uploade un CSV.
4. Il mappe les colonnes.
5. Il sélectionne 3 produits.
6. Il lance une analyse mockée.
7. Il voit le score.
8. Il ouvre une action card.
9. Il modifie une recommandation.
10. Il exporte un CSV.
```

Scénario E2E Shopify staging :

```text
1. L’app est installée sur une dev store.
2. Elle récupère les produits.
3. L’utilisateur sélectionne un produit.
4. Il lance une analyse mockée.
5. Il voit une action card.
6. Il valide une modification.
7. L’app applique la modification sur un produit test.
8. L’app permet le rollback.
```

### 14.6 Tests de non-régression avant déploiement

Checklist automatique :

```text
npm run lint
npm run test:backend
npm run test:frontend
npm run test:e2e:csv
npm run build:frontend
npm run build:backend
prisma migrate deploy --dry-run si possible
```

Checklist manuelle avant production :

- upload CSV réel ;
- export CSV réel ;
- analyse avec mocks ;
- analyse avec une vraie API IA sur faible volume ;
- vérification coût estimé ;
- vérification logs ;
- vérification rollback Shopify si activé.

---

## 15. Développement étape par étape — ordre recommandé

### Phase 0 — Préparation projet

Objectif : créer le socle technique.

Tâches :

- créer repo Git ;
- choisir monorepo simple ou Nx ;
- choisir et documenter des versions LTS/stables ;
- créer Angular app ;
- installer Tailwind ;
- configurer l’internationalisation frontend français/anglais ;
- créer un sélecteur de langue `FR / EN` ;
- créer NestJS API ;
- configurer des codes d’erreur backend stables et traduisibles côté frontend ;
- config PostgreSQL ;
- config Prisma ;
- config tests ;
- config lint/format ;
- créer Docker Compose local pour Postgres/Redis avec tags de versions explicites.

Livrable :

```text
Frontend Angular affiche une page d’accueil disponible en français et en anglais.
Backend NestJS répond à /health.
PostgreSQL connecté.
Versions LTS/stables documentées.
CI GitHub Actions minimale.
```

### Phase 1 — Mode CSV brut

Objectif : importer un CSV et afficher des produits.

Tâches :

- écran upload CSV traduit en français et anglais ;
- backend upload ;
- parsing CSV ;
- prévisualisation ;
- mapping manuel ;
- messages d’erreur structurés et traduits côté UI ;
- sauvegarde projet ;
- sauvegarde produits normalisés.

Livrable :

```text
Un utilisateur importe un CSV et voit une table de produits normalisés.
```

### Phase 2 — Génération de prompts

Objectif : générer des requêtes d’achat pour les produits.

Tâches :

- templates de prompts simples ;
- génération par produit ;
- édition manuelle d’un prompt ;
- sauvegarde prompts ;
- limite de prompts par plan.

Livrable :

```text
Pour chaque produit sélectionné, l’app propose 5 prompts d’achat.
```

### Phase 3 — Analyse IA mockée

Objectif : construire toute la mécanique sans coût IA.

Tâches :

- créer réponses IA mockées ;
- parser les réponses ;
- détecter produit/marque/domaine ;
- détecter concurrents ;
- calculer score ;
- afficher résultats.

Livrable :

```text
L’utilisateur lance une analyse fictive et obtient un score + concurrents.
```

### Phase 4 — Action Cards

Objectif : générer des recommandations utiles.

Tâches :

- règles simples de recommandation ;
- génération action cards ;
- statut proposed/accepted/edited/rejected ;
- interface de validation ;
- export recommandations.

Livrable :

```text
L’utilisateur reçoit des recommandations validables et exportables.
```

### Phase 5 — APIs IA réelles

Objectif : remplacer les mocks par des appels contrôlés.

Tâches :

- intégration Perplexity ou Search API ;
- intégration Gemini grounding ;
- intégration OpenAI web search proxy ;
- quotas ;
- logs coût ;
- timeout ;
- retry ;
- fallback ;
- stockage des réponses.

Livrable :

```text
L’app peut analyser quelques prompts réels avec coûts maîtrisés.
```

### Phase 6 — Première démo CSV vendable

Objectif : prouver la valeur.

Tâches :

- créer 3 catalogues CSV réalistes ;
- lancer audits ;
- améliorer UX ;
- préparer rapport exportable ;
- faire tester à 2 ou 3 personnes.

Livrable :

```text
Un freelance peut uploader un CSV client et repartir avec un audit exploitable.
```

### Phase 7 — Préparation Shopify

Objectif : créer les boutiques de test.

Tâches :

- créer compte Shopify Partner ;
- créer 3 development stores ;
- remplir catalogues réalistes ;
- créer une app Shopify privée/dev ;
- config OAuth ;
- tester tunnel local ;
- créer module Shopify dans NestJS.

Livrable :

```text
L’app peut être installée sur une dev store Shopify.
```

### Phase 8 — Lecture produits Shopify

Objectif : connecter Shopify au même core.

Tâches :

- récupérer produits via Admin API ;
- mapper vers `NormalizedProduct` ;
- afficher produits dans Angular ;
- sélectionner produits ;
- lancer même analyse que CSV.

Livrable :

```text
Un produit Shopify passe dans le même pipeline que le CSV.
```

### Phase 9 — Application de modifications Shopify

Objectif : appliquer uniquement les actions validées.

Tâches :

- ajouter scope `write_products` ;
- stocker ancienne valeur ;
- appliquer modification ;
- afficher historique ;
- rollback.

Livrable :

```text
Après validation humaine, l’app modifie un produit Shopify test et peut revenir en arrière.
```

### Phase 10 — Staging et bêta privée

Objectif : tester avec vrais utilisateurs.

Tâches :

- déployer staging ;
- brancher une vraie boutique pilote ;
- tester coûts ;
- collecter feedback ;
- corriger UX ;
- améliorer prompts et recommandations.

Livrable :

```text
2 à 5 boutiques pilotes utilisent PromptRank sur un petit volume de produits.
```

---

## 16. Données et sécurité

### 15.1 Données sensibles

PromptRank manipule :

- catalogues produits ;
- descriptions ;
- prix ;
- URLs ;
- tokens Shopify ;
- résultats d’analyse ;
- éventuellement informations de boutique.

### 15.2 Règles minimales

- chiffrer les secrets ;
- ne jamais logger les tokens ;
- limiter la rétention des CSV ;
- proposer suppression projet ;
- séparer staging/production ;
- limiter les droits Shopify ;
- ne pas envoyer de données inutiles aux APIs IA.

---

## 17. Pricing initial recommandé

Le coût principal vient du nombre de prompts testés.

### Free

```text
0 €
1 projet
5 produits analysés
20 prompts maximum
export limité
```

### Starter

```text
19 €/mois
25 produits suivis
100 prompts/mois
CSV + Shopify lecture
action cards
export CSV
```

### Growth

```text
49 €/mois
100 produits suivis
500 prompts/mois
retest manuel
historique simple
application Shopify validée
```

### Pro

```text
99 €/mois
500 produits suivis
2 000 prompts/mois
monitoring mensuel
priorisation produits
support prioritaire
```

À ajuster selon les coûts réels API.

---

## 18. Positionnement final

Phrase courte :

> **PromptRank est le SEO checker des produits pour les réponses IA shopping.**

Phrase complète :

> **PromptRank aide les petites boutiques à identifier les requêtes ChatGPT, Gemini et Perplexity où leurs produits sont invisibles, à comprendre quels concurrents apparaissent à leur place, puis à appliquer des optimisations de fiches produits après validation humaine.**

Positionnement face à Profound :

```text
Profound = plateforme enterprise de visibilité IA.
PromptRank = outil simple, petit marchand, Shopify/CSV, orienté action produit.
```

Positionnement face à Channable :

```text
Channable = distribution et transformation de flux.
PromptRank = diagnostic de visibilité IA et recommandations produit.
```

---

## 19. Références techniques à suivre pendant le développement

Ces sources doivent être revérifiées régulièrement car les APIs et règles évoluent vite.

- Shopify CLI : https://shopify.dev/docs/api/shopify-cli
- Shopify CLI for apps : https://shopify.dev/docs/apps/build/cli-for-apps
- Shopify deploy to hosting service : https://shopify.dev/docs/apps/launch/deployment/deploy-to-hosting-service
- Shopify custom authorization hors template React Router : https://shopify.dev/docs/apps/build/authentication-authorization/implement-custom-authorization
- Shopify Product object : https://shopify.dev/docs/api/admin-graphql/latest/objects/product
- Shopify productUpdate mutation : https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate
- Angular Tailwind guide : https://angular.dev/guide/tailwind
- Tailwind Angular install guide : https://tailwindcss.com/docs/installation/framework-guides/angular
- Angular internationalization guide : https://angular.dev/guide/i18n
- Transloco documentation : https://jsverse.gitbook.io/transloco
- ngx-translate documentation : https://ngx-translate.org/
- Node.js release schedule : https://nodejs.org/en/about/previous-releases
- NestJS Prisma recipe : https://docs.nestjs.com/recipes/prisma
- OpenAI product feed specification : https://developers.openai.com/commerce/specs/file-upload/products
- OpenAI commerce get started : https://developers.openai.com/commerce/guides/get-started
- Gemini grounding with Google Search : https://ai.google.dev/gemini-api/docs/google-search
- Perplexity API docs : https://docs.perplexity.ai

---

## 20. Prochaine action concrète

La prochaine action n’est pas de créer le plugin Shopify.

La prochaine action est :

> **Créer le socle Angular + Tailwind + NestJS en versions LTS/stables, configurer l’internationalisation français/anglais, puis livrer le premier flux CSV : upload → mapping → produits normalisés.**

Critères techniques de ce premier jalon :

```text
Versions LTS/stables documentées dans le README.
Aucun tag Docker latest.
Interface disponible en français et en anglais.
Erreurs API connues traduites côté frontend.
```

Jalon 1 :

```text
Un CSV est importé.
Les colonnes sont mappées.
Les produits apparaissent dans une table.
Les produits sont stockés en base comme NormalizedProduct.
```

Jalon 2 :

```text
Pour 3 produits sélectionnés, l’app génère 5 prompts chacun.
```

Jalon 3 :

```text
Avec réponses IA mockées, l’app affiche un score et 3 action cards.
```

C’est seulement après ces jalons que Shopify devient prioritaire.
