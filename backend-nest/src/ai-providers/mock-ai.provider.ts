import { Injectable } from '@nestjs/common';
import type { AiProviderResponse } from '@promptrank/shared-types';
import type { AiProviderInput, AiProviderServiceAdapter } from './ai-provider.types';

@Injectable()
export class MockAiProvider implements AiProviderServiceAdapter {
  readonly provider = 'mock' as const;
  readonly model = 'mock-v1';
  private readonly competitorDictionary = ['Stanley', 'Quechua', 'Decathlon', 'Nike', 'Adidas', 'Apple', 'Samsung', 'Amazon Basics', 'Anker'];

  async generateResponse(input: AiProviderInput): Promise<AiProviderResponse> {
    return {
      provider: this.provider,
      model: this.model,
      responseText: this.simulateResponse(input),
      status: 'completed',
    };
  }

  private simulateResponse(input: AiProviderInput): string {
    const product = input.product;
    const seed = (input.promptText + (product.title || '') + (product.brand || '')).length % 5;
    const brand = product.brand || 'Cette marque';
    const title = product.title || 'ce produit';
    const competitors = this.competitorDictionary.slice(seed, seed + 2);
    const prefix = input.language.startsWith('fr') ? 'Pour ce besoin' : 'For this need';
    if (seed === 0) return `${prefix}, ${brand} est une option pertinente. ${title} peut convenir. Alternatives: ${competitors.join(' et ')}.`;
    if (seed === 1) return `${prefix}, ${title} est souvent cité. Des alternatives incluent ${competitors.join(' and ')}.`;
    if (seed === 2) return `${prefix}, des options comme ${competitors.join(' et ')} sont souvent recommandées.`;
    if (seed === 3) return `${prefix}, cette option reste correcte sans avantage clair.`;
    return `${prefix}, ${brand} peut être envisagé mais certains retours sont mitigés.`;
  }
}
