import type { AiProvider, AiProviderResponse } from '@promptrank/shared-types';

export type ProductContext = {
  id: string;
  title?: string | null;
  description?: string | null;
  brand?: string | null;
  productType?: string | null;
  category?: string | null;
  tags?: unknown;
  attributes?: unknown;
};

export type AiProviderInput = {
  projectId: string;
  productId: string;
  promptId: string;
  promptText: string;
  language: string;
  country: string;
  product: ProductContext;
};

export interface AiProviderServiceAdapter {
  readonly provider: AiProvider;
  generateResponse(input: AiProviderInput): Promise<AiProviderResponse>;
}
