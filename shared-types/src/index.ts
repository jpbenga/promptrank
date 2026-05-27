export type ApiErrorCode =
  | 'CSV_INVALID_FILE_TYPE'
  | 'CSV_FILE_TOO_LARGE'
  | 'CSV_PARSE_ERROR'
  | 'CSV_EMPTY_FILE'
  | 'CSV_NO_COLUMNS_FOUND'
  | 'CSV_MAPPING_MISSING_TITLE'
  | 'PROJECT_NOT_FOUND'
  | 'PRODUCT_IMPORT_FAILED'
  | 'PROMPT_ANALYSIS_NO_PROMPTS'
  | 'PROMPT_ANALYSIS_LIMIT_EXCEEDED'
  | 'PROMPT_ANALYSIS_FAILED'
  | 'PROMPT_NOT_FOUND'
  | 'SCORE_NO_PROMPT_RUNS'
  | 'SCORE_COMPUTE_FAILED'
  | 'ACTION_CARDS_NO_SCORES'
  | 'ACTION_CARD_NOT_FOUND'
  | 'ACTION_CARD_UPDATE_INVALID'
  | 'ACTION_CARDS_GENERATION_FAILED';

export type NormalizedProduct = {
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

export type Project = {
  id: string;
  name: string;
  source: 'csv';
  primaryLanguage: string;
  targetCountry: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type CsvImportPreview = {
  csvImportId: string;
  columns: string[];
  previewRows: Record<string, string>[];
  rowCount: number;
  detectedDelimiter: string;
};

export type CsvColumnMapping = Record<string, keyof Omit<NormalizedProduct, 'id' | 'rawSource'>>;

export type PromptIntent = 'best' | 'cheap' | 'alternative' | 'use_case' | 'comparison' | 'problem_solution' | 'gift' | 'local';
export type PromptStatus = 'proposed' | 'edited' | 'disabled';
export type PromptSource = 'template' | 'manual';

export type ProductPrompt = {
  id: string;
  projectId: string;
  productId: string;
  text: string;
  language: string;
  country: string;
  intent: PromptIntent;
  source: PromptSource;
  status: PromptStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type GeneratePromptsRequest = {
  productIds: string[];
  promptsPerProduct?: number;
  language?: string;
  country?: string;
};

export type GeneratePromptsResponse = {
  promptsByProduct: Record<string, ProductPrompt[]>;
  generatedCount: number;
};

export type UpdatePromptRequest = {
  text?: string;
  status?: PromptStatus;
};


export type PromptRunProvider = 'mock';
export type PromptRunStatus = 'completed' | 'failed';
export type PromptRunSentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export type PromptRun = {
  id: string;
  projectId: string;
  productId: string;
  promptId: string;
  provider: PromptRunProvider;
  model: 'mock-v1';
  responseText: string;
  brandMentioned: boolean;
  productMentioned: boolean;
  competitorsMentioned: string[];
  position: number | null;
  sentiment: PromptRunSentiment;
  status: PromptRunStatus;
  createdAt: string;
  updatedAt: string;
};

export type AnalyzePromptsRequest = { promptIds: string[] };
export type PromptAnalysisResult = { prompt: ProductPrompt; run: PromptRun };
export type AnalyzePromptsResponse = { results: PromptAnalysisResult[] };

export type VisibilityScoreScope = 'project' | 'product';
export type VisibilityScoreSentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export type VisibilityScoreDetails = Record<string, unknown>;

export type VisibilityScore = {
  id: string;
  projectId: string;
  productId: string | null;
  scope: VisibilityScoreScope;
  score: number;
  analyzedPromptsCount: number;
  brandMentionRate: number;
  productMentionRate: number;
  competitorMentionRate: number;
  averagePosition: number | null;
  dominantSentiment: VisibilityScoreSentiment;
  topCompetitors: string[];
  details: VisibilityScoreDetails;
  createdAt: string;
  updatedAt: string;
};

export type ProductVisibilityScore = VisibilityScore & {
  scope: 'product';
  productId: string;
};

export type ProjectVisibilityScore = VisibilityScore & {
  scope: 'project';
  productId: null;
};

export type ComputeScoresRequest = Record<string, never>;

export type ComputeScoresResponse = {
  projectScore: ProjectVisibilityScore;
  productScores: ProductVisibilityScore[];
};

export type ActionCardCategory =
  | 'title'
  | 'description'
  | 'content'
  | 'comparison'
  | 'faq'
  | 'pricing'
  | 'availability'
  | 'brand'
  | 'competitors'
  | 'technical'
  | 'other';

export type ActionCardPriority = 'high' | 'medium' | 'low';
export type ActionCardStatus = 'open' | 'done' | 'dismissed';
export type ActionCardImpact = 'high' | 'medium' | 'low';
export type ActionCardEffort = 'high' | 'medium' | 'low';
export type ActionCardMetadata = Record<string, unknown>;

export type ActionCard = {
  id: string;
  projectId: string;
  productId: string | null;
  scoreId: string | null;
  title: string;
  description: string;
  category: ActionCardCategory;
  priority: ActionCardPriority;
  status: ActionCardStatus;
  impact: ActionCardImpact;
  effort: ActionCardEffort;
  reason: string;
  recommendation: string;
  metadata: ActionCardMetadata;
  createdAt: string;
  updatedAt: string;
};

export type GenerateActionCardsRequest = Record<string, never>;

export type GenerateActionCardsResponse = {
  cards: ActionCard[];
  projectCards: ActionCard[];
  cardsByProduct: Record<string, ActionCard[]>;
  generatedCount: number;
};

export type UpdateActionCardRequest = {
  status?: ActionCardStatus;
  title?: string;
  description?: string;
  recommendation?: string;
};
