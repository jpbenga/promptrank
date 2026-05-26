export type ApiErrorCode = 'CSV_INVALID_FILE_TYPE' | 'CSV_FILE_TOO_LARGE' | 'CSV_PARSE_ERROR' | 'CSV_EMPTY_FILE' | 'CSV_NO_COLUMNS_FOUND' | 'CSV_MAPPING_MISSING_TITLE' | 'PROJECT_NOT_FOUND' | 'PRODUCT_IMPORT_FAILED';
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
