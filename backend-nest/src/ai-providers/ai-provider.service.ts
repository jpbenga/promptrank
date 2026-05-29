import { BadRequestException, Injectable } from '@nestjs/common';
import type { AiProvider, AiProviderResponse } from '@promptrank/shared-types';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiProvider } from './openai.provider';
import type { AiProviderInput } from './ai-provider.types';

@Injectable()
export class AiProviderOrchestratorService {
  constructor(
    private readonly mockProvider: MockAiProvider,
    private readonly openAiProvider: OpenAiProvider,
  ) {}

  async generateResponse(input: AiProviderInput, requestedProvider?: string): Promise<AiProviderResponse> {
    const provider = this.resolveProvider(requestedProvider);
    if (provider === 'mock') return this.mockProvider.generateResponse(input);
    if (provider === 'openai') return this.openAiProvider.generateResponse(input);
    throw new BadRequestException({ code: 'AI_PROVIDER_UNSUPPORTED', message: 'Unsupported AI provider' });
  }

  resolveProvider(requestedProvider?: string): AiProvider {
    const provider = (requestedProvider || process.env.AI_PROVIDER_DEFAULT || 'mock').toLowerCase();
    if (provider === 'mock' || provider === 'openai') return provider;
    throw new BadRequestException({ code: 'AI_PROVIDER_UNSUPPORTED', message: 'Unsupported AI provider' });
  }
}
