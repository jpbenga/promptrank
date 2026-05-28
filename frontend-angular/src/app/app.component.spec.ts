import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ApiService, AppComponent, MappingComponent, NewProjectComponent, PreviewComponent, ProductsComponent } from './app.component';

const translations = {
  app: {
    title: 'PromptRank',
    subtitle: 'Phase 1 CSV',
    language: { fr: 'FR', en: 'EN' },
  },
  nav: { home: 'Accueil', newProject: 'Créer un projet' },
  common: { back: 'Retour', backHome: "Revenir à l'accueil", create: 'Créer', save: 'Enregistrer', delete: 'Supprimer' },
  flowStepper: {
    ariaLabel: 'Progression du flow CSV',
    status: { completed: 'Terminé', current: 'En cours', upcoming: 'À venir' },
    steps: { project: 'Projet', upload: 'Upload', preview: 'Preview', mapping: 'Mapping', products: 'Résultat' },
  },
  states: {
    creating: 'Création en cours...',
    loading: 'Chargement...',
    saving: 'Enregistrement...',
    savingAndImporting: 'Enregistrement et import...',
    empty: 'Aucune donnée disponible.',
    emptyTitle: 'Aucune donnée à afficher',
    notAvailable: 'N/A',
  },
  projectCreate: {
    eyebrow: 'Nouveau projet',
    title: 'Nouveau projet CSV',
    description: 'Description projet',
    submitHelp: 'Redirection après création.',
    fields: {
      name: {
        label: 'Nom du projet',
        placeholder: 'Boutique gourdes client X',
        help: 'Obligatoire.',
        errors: { required: 'Le nom du projet est obligatoire.', minlength: 'Trop court.', maxlength: 'Trop long.' },
      },
      primaryLanguage: {
        label: 'Langue principale',
        placeholder: 'fr',
        help: 'fr ou en.',
        errors: { required: 'Langue obligatoire.', pattern: 'Utilisez fr ou en.' },
      },
      targetCountry: {
        label: 'Pays cible',
        placeholder: 'FR',
        help: 'Deux lettres.',
        errors: { required: 'Pays obligatoire.', pattern: 'Deux lettres majuscules.' },
      },
      currency: {
        label: 'Devise',
        placeholder: 'EUR',
        help: 'Trois lettres.',
        errors: { required: 'Devise obligatoire.', pattern: 'Trois lettres majuscules.' },
      },
    },
  },
  csvPreview: {
    eyebrow: 'Aperçu',
    title: 'Aperçu CSV',
    description: 'Vérifiez rapidement la structure détectée.',
    delimiter: 'Séparateur détecté',
    columnCount: 'Nombre de colonnes',
    rowCount: 'Nombre de lignes',
    columns: 'Colonnes détectées',
    tableTitle: 'Aperçu des lignes',
    tableHelp: 'La preview affiche uniquement les 20 premières lignes du fichier.',
    continue: 'Continuer vers le mapping',
    empty: 'Importez un CSV pour générer un aperçu.',
    tabDelimiter: 'Tabulation',
  },
  csvMapping: {
    eyebrow: 'Mapping',
    title: 'Mapping des colonnes',
    description: 'Associez les colonnes.',
    tableTitle: 'Colonnes à associer',
    titleRequiredHelp: 'Le champ title doit être mappé.',
    requiredBadge: 'title obligatoire',
    csvColumn: 'Colonne CSV',
    targetField: 'Champ produit normalisé',
    status: 'Statut',
    noTarget: 'Ne pas importer',
    autoMapped: 'Auto-mappé',
    recommendedBadge: 'Recommandé',
    unmappedBadge: 'Non mappé',
    unmappedTitle: 'Colonnes non mappées',
    unmappedHelp: 'Ces colonnes ne seront pas affichées dans la table principale, mais seront conservées dans les attributs du produit.',
    recommendedWarningTitle: 'Champs recommandés non mappés',
    recommendedWarningText: '{{fields}} ne sont pas mappés.',
    save: 'Enregistrer le mapping',
    saveAndImport: 'Enregistrer le mapping et importer',
    saveAndImportNote: "Le mapping affiché sera enregistré avant l'import.",
    recommendedTitle: 'Champs recommandés',
    recommendedText: 'title est obligatoire.',
    recommended: {
      description: 'description',
      price: 'price',
      url: 'url',
      taxonomy: 'taxonomy',
    },
    summary: {
      title: 'Résumé avant import',
      help: 'Vérifiez avant import.',
      mapped: 'Colonnes mappées',
      unmapped: 'Colonnes non mappées',
      recommendedMissing: 'Recommandés manquants',
      recommendedMissingList: 'Champs recommandés manquants :',
      titleOk: 'title OK',
      titleMissing: 'title manquant',
      taxonomyGroup: 'category ou productType',
    },
    fields: {
      title: 'Titre',
      description: 'Description',
      price: 'Prix',
      sku: 'SKU',
      brand: 'Marque',
      vendor: 'Vendeur',
      productType: 'Type produit',
      category: 'Catégorie',
      url: 'URL',
      imageUrls: 'Images',
      gtin: 'GTIN / EAN',
      availability: 'Disponibilité',
      tags: 'Tags',
      seoTitle: 'Titre SEO',
      metaDescription: 'Meta description',
    },
  },
  products: {
    eyebrow: 'Résultat',
    title: 'Produits normalisés',
    description: 'Contrôlez les produits importés.',
    empty: 'Aucun produit importé pour le moment.',
    importAnotherCsv: 'Importer un autre CSV',
    createAnother: 'Créer un autre projet',
    summary: { countLabel: 'Produits importés', projectLabel: 'Projet courant' },
    selection: {
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner',
      count: '{{selected}} produits sélectionnés',
      maxNotice: 'Seuls {{max}} produits maximum peuvent être sélectionnés pour la génération.',
    },
    columns: {
      title: 'Titre',
      sku: 'SKU',
      brand: 'Marque',
      category: 'Catégorie',
      price: 'Prix',
      currency: 'Devise',
      availability: 'Disponibilité',
      url: 'URL',
    },
  },
  prompts: {
    title: 'Prompts',
    generate: 'Générer des prompts',
    generating: 'Génération en cours...',
    generatingDetail: 'Génération des prompts en cours...',
    generateSuccess: '{{count}} prompts générés.',
    generatedCount: '{{count}} prompts générés',
    groupCount: '{{count}} prompts',
    saving: 'Enregistrement en cours...',
    saveSuccess: 'Prompt enregistré.',
    saveError: "Erreur lors de l'enregistrement.",
    limit: 'Limites locales/demo',
    limitDetail: '{{maxProducts}} produits maximum / {{promptsPerProduct}} prompts par produit',
    empty: 'Aucun prompt généré pour le moment.',
    updateSuccess: 'Prompt mis à jour.',
    deleteSuccess: 'Prompt désactivé.',
    status: { proposed: 'proposé', edited: 'édité', disabled: 'désactivé' },
    source: { template: 'template', manual: 'manual' },
    intent: { best: 'meilleur' },
  },
  simAnalysis: {
    title: 'Analyse simulée',
    analyze: 'Analyser les réponses simulées',
    response: 'Réponse simulée',
    brand: 'Marque mentionnée',
    product: 'Produit mentionné',
    competitors: 'Concurrents mentionnés',
    sentiment: 'Sentiment',
    mockNotice: 'Simulation sans appel IA réel',
    loading: 'Analyse en cours',
    done: 'Analyse terminée',
    empty: "Aucun résultat d'analyse",
  },
  aiProvider: {
    label: 'Provider IA',
    mock: 'Mock local',
    openai: 'OpenAI',
    openaiNotice: 'Provider réel configuré côté serveur',
    openaiRequiresBackend: 'OpenAI nécessite une configuration backend',
    noRealCallWithoutConfig: 'Aucun appel IA réel sans configuration explicite',
  },
  visibilityScores: {
    title: 'Scores de visibilité',
    help: 'Le score est calculé depuis les analyses simulées existantes, sans appel IA réel.',
    compute: 'Calculer les scores',
    projectScore: 'Score projet',
    productScore: 'Score produit',
    analyzedPrompts: 'Prompts analysés',
    brandMentionRate: 'Taux mention marque',
    productMentionRate: 'Taux mention produit',
    competitorMentionRate: 'Taux concurrents',
    averagePosition: 'Position moyenne',
    dominantSentiment: 'Sentiment dominant',
    topCompetitors: 'Top concurrents',
    empty: 'Aucun score disponible',
    noRuns: "Aucun run d'analyse disponible",
    loading: 'Calcul en cours',
    success: 'Score calculé',
    scoreOutOf100: 'Score sur 100',
  },
  actionCards: {
    title: 'Recommandations',
    subtitle: 'Action cards',
    help: 'Recommandation déterministe issue des scores simulés.',
    generate: 'Générer les recommandations',
    success: '{{count}} recommandations générées',
    empty: 'Aucune recommandation disponible',
    noScores: 'Aucun score disponible',
    loading: 'Génération des recommandations en cours',
    projectGroup: 'Globales projet',
    priority: 'Priorité',
    impact: 'Impact',
    effort: 'Effort',
    statusLabel: 'Statut',
    status: { open: 'Ouvert', done: 'Fait', dismissed: 'Ignoré' },
    category: 'Catégorie',
    reason: 'Raison',
    recommendation: 'Recommandation',
    markDone: 'Marquer comme fait',
    dismiss: 'Ignorer',
    updatingDone: 'Marquage en cours...',
    updatingDismissed: 'Ignorance en cours...',
    feedback: { done: 'Action marquée comme faite.', dismissed: 'Recommandation ignorée.' },
    statusMessage: {
      open: 'Cette recommandation est ouverte.',
      done: 'Cette recommandation est marquée comme faite.',
      dismissed: 'Cette recommandation est ignorée.',
    },
    level: { low: 'Faible', medium: 'Moyen', high: 'Élevé' },
    categoryLabels: { comparison: 'Comparaison', brand: 'Marque', content: 'Contenu', description: 'Description', title: 'Titre' },
  },
  errors: {
    CSV_MAPPING_MISSING_TITLE: 'Le champ title est obligatoire.',
    PROMPT_ANALYSIS_NO_PROMPTS: 'Aucun prompt sélectionné',
    SCORE_NO_PROMPT_RUNS: "Aucun run d'analyse disponible",
    ACTION_CARDS_NO_SCORES: 'Aucun score disponible',
    AI_PROVIDER_DISABLED: 'Provider IA désactivé',
    AI_PROVIDER_NOT_CONFIGURED: 'Provider IA non configuré',
  },
};

class TestTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of(translations);
  }
}

function configureTranslate() {
  return TranslateModule.forRoot({
    defaultLanguage: 'fr',
    loader: { provide: TranslateLoader, useClass: TestTranslateLoader },
  });
}

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent, configureTranslate()],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the FR/EN language selector and translated navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PromptRank');
    expect(text).toContain('Accueil');
    expect(text).toContain('FR');
    expect(text).toContain('EN');
  });
});

describe('NewProjectComponent', () => {
  let fixture: ComponentFixture<NewProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewProjectComponent, configureTranslate()],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { createProject: () => of({ id: 'p1' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NewProjectComponent);
    fixture.detectChanges();
  });

  it('keeps the project form invalid when name is empty', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });

  it('keeps the create button disabled when currency does not have three uppercase letters', async () => {
    const setInput = (name: string, value: string) => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[name="${name}"]`);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    };

    setInput('name', 'Projet CSV');
    setInput('primaryLanguage', 'fr');
    setInput('targetCountry', 'FR');
    setInput('currency', 'EU');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });
});

describe('PreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewComponent, configureTranslate()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'p1' } } },
        },
      ],
    }).compileComponents();
  });

  it('renders detected CSV columns and preview rows', () => {
    const fixture = TestBed.createComponent(PreviewComponent);
    fixture.componentInstance.preview = {
      id: 'csv1',
      detectedDelimiter: ';',
      rowCount: 2,
      columns: ['nom_produit', 'prix_ttc'],
      previewRows: [
        { nom_produit: 'Gourde inox', prix_ttc: '24.90' },
        { nom_produit: 'Lampe LED', prix_ttc: '39.00' },
      ],
    };

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Séparateur détecté');
    expect(text).toContain(';');
    expect(text).toContain('Nombre de colonnes');
    expect(text).toContain('2');
    expect(text).toContain('Colonnes détectées');
    expect(text).toContain('nom_produit');
    expect(text).toContain('prix_ttc');
    expect(text).toContain('Gourde inox');
    expect(text).toContain('Lampe LED');
    expect(text).toContain('Continuer vers le mapping');
    expect(text).not.toContain('Analyse simulée');
  });
});

describe('MappingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingComponent, configureTranslate()],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            saveMapping: () => of({ mapping: { couleur: '', matiere: '', capacite: '', prix_ttc: 'price' } }),
            importProducts: () => of({ importedCount: 0, skippedCount: 0, errors: [] }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'p1' } } },
        },
      ],
    })
      .compileComponents();
  });

  it('signals that title is required on the mapping page', () => {
    const fixture = TestBed.createComponent(MappingComponent);
    fixture.componentInstance.preview = { id: 'i1', columns: ['prix_ttc', 'couleur', 'matiere', 'capacite'] };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('title obligatoire');
    expect(text).toContain('title manquant');
  });

  it('explains that unmapped columns are preserved in attributes', () => {
    const fixture = TestBed.createComponent(MappingComponent);
    fixture.componentInstance.preview = { id: 'i1', columns: ['prix_ttc', 'couleur', 'matiere', 'capacite'] };
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Colonnes non mappées');
    expect(text).toContain('conservées dans les attributs du produit');
    expect(text).toContain('couleur');
    expect(text).toContain('matiere');
    expect(text).toContain('capacite');
  });
});

describe('ProductsComponent Phase 2 prompts', () => {
  const products = Array.from({ length: 6 }, (_, index) => ({
    id: `p${index + 1}`,
    title: `Produit ${index + 1}`,
    sku: `S${index + 1}`,
    brand: 'B',
    category: 'C',
    price: 10,
    currency: 'EUR',
    availability: 'in_stock',
  }));
  const prompt = { id: 'pr1', projectId: 'x', productId: 'p1', text: 'meilleur produit', status: 'proposed', intent: 'best', source: 'template', language: 'fr', country: 'FR', position: 0, createdAt: '', updatedAt: '' };
  const analysisResult = {
    prompt,
    run: {
      id: 'run-1',
      projectId: 'project-1',
      productId: 'p1',
      promptId: 'pr1',
      provider: 'mock',
      model: 'mock-v1',
      responseText: 'Réponse simulée test',
      brandMentioned: true,
      productMentioned: false,
      competitorsMentioned: ['Stanley'],
      position: 1,
      sentiment: 'positive',
      status: 'completed',
      createdAt: '2026-05-27T10:00:00.000Z',
      updatedAt: '2026-05-27T10:00:00.000Z',
    },
  };
  const scoreResponse = {
    projectScore: {
      id: 'score-project',
      projectId: 'project-1',
      productId: null,
      scope: 'project',
      score: 84,
      analyzedPromptsCount: 2,
      brandMentionRate: 0.5,
      productMentionRate: 1,
      competitorMentionRate: 1,
      averagePosition: 1.5,
      dominantSentiment: 'positive',
      topCompetitors: ['Stanley'],
      details: {},
      createdAt: '2026-05-27T10:00:00.000Z',
      updatedAt: '2026-05-27T10:00:00.000Z',
    },
    productScores: [{
      id: 'score-product',
      projectId: 'project-1',
      productId: 'p1',
      scope: 'product',
      score: 84,
      analyzedPromptsCount: 2,
      brandMentionRate: 0.5,
      productMentionRate: 1,
      competitorMentionRate: 1,
      averagePosition: 1.5,
      dominantSentiment: 'positive',
      topCompetitors: ['Stanley'],
      details: {},
      createdAt: '2026-05-27T10:00:00.000Z',
      updatedAt: '2026-05-27T10:00:00.000Z',
    }],
  };
  const actionCard = {
    id: 'action-1',
    projectId: 'project-1',
    productId: 'p1',
    scoreId: 'score-product',
    title: 'Créer un contenu comparatif',
    description: 'Des concurrents apparaissent fortement.',
    category: 'comparison',
    priority: 'high',
    status: 'open',
    impact: 'medium',
    effort: 'medium',
    reason: 'Les concurrents détectés sont présents: Stanley.',
    recommendation: 'Créer du contenu comparatif avec les concurrents détectés.',
    metadata: {},
    createdAt: '2026-05-27T10:00:00.000Z',
    updatedAt: '2026-05-27T10:00:00.000Z',
  };
  const actionCardsResponse = {
    cards: [actionCard],
    projectCards: [],
    cardsByProduct: { p1: [actionCard] },
    generatedCount: 1,
  };
  let apiMock: any;
  let lastAnalyzeProvider: string | undefined;

  beforeEach(async () => {
    lastAnalyzeProvider = undefined;
    apiMock = {
      listProducts: () => of(products),
      generatePrompts: () => of({ generatedCount: 1, promptsByProduct: { p1: [prompt] } }),
      listPrompts: () => of([prompt]),
      updatePrompt: () => of({ ...prompt, text: 'modifié', status: 'edited', source: 'manual' }),
      deletePrompt: () => of({}),
      analyzePrompts: (_projectId: string, _promptIds: string[], provider?: string) => {
        lastAnalyzeProvider = provider;
        return of({
        results: [analysisResult],
        });
      },
      computeScores: () => of(scoreResponse),
      generateActionCards: () => of(actionCardsResponse),
      updateActionCard: (_projectId: string, _id: string, payload: any) => of({ ...actionCard, status: payload.status }),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, ProductsComponent, configureTranslate()],
      providers: [
        provideRouter([{ path: 'projects/:id/products', component: (AppComponent as any) }]),
        { provide: ApiService, useValue: apiMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'project-1' } } } },
      ],
    }).compileComponents();
  });

  it('shows prompt limit translation key and generate disabled with no selection in products page template', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PromptRank');
  });

  it('shows selection actions above the products table and caps select all at five products', async () => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tout sélectionner');
    expect(text).toContain('Tout désélectionner');
    expect(text).toContain('5 produits maximum');
    expect(text.indexOf('Tout sélectionner')).toBeLessThan(text.indexOf('Titre'));

    fixture.componentInstance.selectAllProducts();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCountValue).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Seuls 5 produits maximum');
  });

  it('keeps generation loading visible briefly and then shows grouped prompts', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.selectAllProducts();
    fixture.detectChanges();

    fixture.componentInstance.generatePrompts();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Génération des prompts en cours...');

    tick(900);
    tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 prompts générés');
    expect(fixture.nativeElement.textContent).toContain('Produit 1');
    expect(fixture.nativeElement.querySelector('#prompts-section')).toBeTruthy();
  }));

  it('disables simulated analysis until a prompt is selected and keeps loading visible for one second', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.selectAllProducts();
    fixture.componentInstance.generatePrompts();
    tick(900);
    tick();
    fixture.detectChanges();

    const analyzeButton = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Analyser les réponses simulées')) as HTMLButtonElement;
    expect(analyzeButton.disabled).toBeTrue();

    fixture.componentInstance.togglePromptSelection('pr1', { target: { checked: true } } as unknown as Event);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedPromptCountValue).toBe(1);
    expect(analyzeButton.disabled).toBeFalse();

    fixture.componentInstance.analyzeSelectedPrompts();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Analyse en cours');
    expect(fixture.componentInstance.runs.length).toBe(0);

    tick(999);
    fixture.detectChanges();
    expect(fixture.componentInstance.analysisLoading).toBeTrue();
    expect(fixture.componentInstance.runs.length).toBe(0);

    tick(1);
    fixture.detectChanges();
    expect(fixture.componentInstance.analysisLoading).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Réponse simulée test');
    expect(fixture.nativeElement.textContent).toContain('Marque mentionnée');
    expect(fixture.nativeElement.textContent).toContain('true');
    expect(fixture.nativeElement.textContent).toContain('Produit mentionné');
    expect(fixture.nativeElement.textContent).toContain('false');
    expect(fixture.nativeElement.textContent).toContain('Concurrents mentionnés');
    expect(fixture.nativeElement.textContent).toContain('Stanley');
    expect(fixture.nativeElement.textContent).toContain('Sentiment');
    expect(fixture.nativeElement.textContent).toContain('positive');
    expect(lastAnalyzeProvider).toBe('mock');
  }));

  it('shows mock as default AI provider and no frontend API key field', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[name="aiProvider"]');
    expect(select).toBeTruthy();
    expect(fixture.componentInstance.selectedAiProvider).toBe('mock');
    expect(fixture.nativeElement.textContent).toContain('Simulation sans appel IA réel');
    expect(fixture.nativeElement.textContent).toContain('Aucun appel IA réel sans configuration explicite');
    expect(fixture.nativeElement.textContent).not.toContain('OPENAI_API_KEY');
  }));

  it('changes AI provider to openai and sends it to analyze', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.togglePromptSelection('pr1', { target: { checked: true } } as unknown as Event);
    fixture.componentInstance.selectedAiProvider = 'openai';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Provider réel configuré côté serveur');
    fixture.componentInstance.analyzeSelectedPrompts();
    tick(1000);
    fixture.detectChanges();

    expect(lastAnalyzeProvider).toBe('openai');
  }));

  it('translates AI provider disabled and not configured errors', fakeAsync(() => {
    apiMock.analyzePrompts = (_projectId: string, _promptIds: string[], provider?: string) => {
      lastAnalyzeProvider = provider;
      return throwError(() => ({ error: { code: provider === 'openai' ? 'AI_PROVIDER_DISABLED' : 'AI_PROVIDER_NOT_CONFIGURED' } }));
    };
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.togglePromptSelection('pr1', { target: { checked: true } } as unknown as Event);
    fixture.componentInstance.selectedAiProvider = 'openai';
    fixture.componentInstance.analyzeSelectedPrompts();
    tick(1000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Provider IA désactivé');

    apiMock.analyzePrompts = () => throwError(() => ({ error: { code: 'AI_PROVIDER_NOT_CONFIGURED' } }));
    fixture.componentInstance.analyzeSelectedPrompts();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Provider IA non configuré');
  }));

  it('keeps visibility score button disabled until simulated analysis has run', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.detectChanges();

    const scoreButton = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(button => button.textContent?.includes('Calculer les scores')) as HTMLButtonElement;
    expect(scoreButton.disabled).toBeTrue();

    fixture.componentInstance.runs = [analysisResult as any];
    fixture.detectChanges();
    expect(scoreButton.disabled).toBeFalse();
  }));

  it('shows score compute action and loading state', fakeAsync(() => {
    const scores$ = new Subject<any>();
    apiMock.computeScores = () => scores$;
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.runs = [analysisResult as any];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Scores de visibilité');
    expect(fixture.nativeElement.textContent).toContain('Calculer les scores');

    fixture.componentInstance.computeVisibilityScores();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Calcul en cours');

    scores$.next(scoreResponse);
    scores$.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Calcul en cours');

    tick(999);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Calcul en cours');

    tick(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Score calculé');
  }));

  it('displays project score, product score, rates and competitors', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.runs = [analysisResult as any];
    fixture.componentInstance.computeVisibilityScores();
    tick(1000);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Score projet');
    expect(text).toContain('84');
    expect(text).toContain('Produit 1');
    expect(text).toContain('Taux mention marque');
    expect(text).toContain('50%');
    expect(text).toContain('Taux mention produit');
    expect(text).toContain('100%');
    expect(text).toContain('Taux concurrents');
    expect(text).toContain('Top concurrents');
    expect(text).toContain('Stanley');
    expect(text).toContain('Sentiment dominant');
    expect(text).toContain('positive');
  }));

  it('translates SCORE_NO_PROMPT_RUNS when score compute fails', fakeAsync(() => {
    apiMock.computeScores = () => throwError(() => ({ error: { code: 'SCORE_NO_PROMPT_RUNS' } }));
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.runs = [analysisResult as any];
    fixture.componentInstance.computeVisibilityScores();
    tick(1000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Aucun run d'analyse disponible");
  }));

  it('shows action card generate action and loading state', fakeAsync(() => {
    const cards$ = new Subject<any>();
    apiMock.generateActionCards = () => cards$;
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recommandations');
    expect(fixture.nativeElement.textContent).not.toContain('Générer les recommandations');

    fixture.componentInstance.projectScore = scoreResponse.projectScore as any;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Générer les recommandations');

    fixture.componentInstance.generateActionCards();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Génération des recommandations en cours');

    cards$.next(actionCardsResponse);
    cards$.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Génération des recommandations en cours');

    tick(999);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Génération des recommandations en cours');

    tick(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 recommandations générées');
  }));

  it('displays action card details, priority, impact, effort and category', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.projectScore = scoreResponse.projectScore as any;
    fixture.componentInstance.generateActionCards();
    tick(1000);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Créer un contenu comparatif');
    expect(text).toContain('Priorité');
    expect(text).toContain('Élevé');
    expect(text).toContain('Impact');
    expect(text).toContain('Moyen');
    expect(text).toContain('Effort');
    expect(text).toContain('Catégorie');
    expect(text).toContain('Comparaison');
    expect(text).toContain('Raison');
    expect(text).toContain('Recommandation');
    expect(text).toContain('Produit 1');
  }));

  it('marks an action card as done and dismissed', fakeAsync(() => {
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.projectScore = scoreResponse.projectScore as any;
    fixture.componentInstance.generateActionCards();
    tick(1000);
    fixture.detectChanges();

    fixture.componentInstance.updateActionCardStatus(actionCard as any, 'done');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fait');
    expect(fixture.nativeElement.textContent).toContain('Action marquée comme faite.');
    expect(fixture.nativeElement.textContent).toContain('Cette recommandation est marquée comme faite.');

    fixture.componentInstance.updateActionCardStatus(actionCard as any, 'dismissed');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ignoré');
    expect(fixture.nativeElement.textContent).toContain('Recommandation ignorée.');
    expect(fixture.nativeElement.textContent).toContain('Cette recommandation est ignorée.');
  }));

  it('translates ACTION_CARDS_NO_SCORES when recommendations generation fails', fakeAsync(() => {
    apiMock.generateActionCards = () => throwError(() => ({ error: { code: 'ACTION_CARDS_NO_SCORES' } }));
    const fixture = TestBed.createComponent(ProductsComponent);
    fixture.detectChanges();
    tick();
    fixture.componentInstance.prompts = [prompt as any];
    fixture.componentInstance.projectScore = scoreResponse.projectScore as any;
    fixture.componentInstance.generateActionCards();
    tick(1000);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucun score disponible');
  }));
});
