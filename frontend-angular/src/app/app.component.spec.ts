import { ComponentFixture, TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
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
  errors: {
    CSV_MAPPING_MISSING_TITLE: 'Le champ title est obligatoire.',
    PROMPT_ANALYSIS_NO_PROMPTS: 'Aucun prompt sélectionné',
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
  let apiMock: any;

  beforeEach(async () => {
    apiMock = {
      listProducts: () => of(products),
      generatePrompts: () => of({ generatedCount: 1, promptsByProduct: { p1: [prompt] } }),
      listPrompts: () => of([prompt]),
      updatePrompt: () => of({ ...prompt, text: 'modifié', status: 'edited', source: 'manual' }),
      deletePrompt: () => of({}),
      analyzePrompts: () => of({
        results: [{
          prompt,
          run: {
            responseText: 'Réponse simulée test',
            brandMentioned: true,
            productMentioned: false,
            competitorsMentioned: ['Stanley'],
            sentiment: 'positive',
          },
        }],
      }),
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
  }));
});
