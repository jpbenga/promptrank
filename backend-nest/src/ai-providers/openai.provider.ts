import { BadRequestException, Injectable } from '@nestjs/common';
import type { AiProviderResponse } from '@promptrank/shared-types';
import type { AiProviderInput, AiProviderServiceAdapter } from './ai-provider.types';

@Injectable()
export class OpenAiProvider implements AiProviderServiceAdapter {
  readonly provider = 'openai' as const;

  async generateResponse(input: AiProviderInput): Promise<AiProviderResponse> {
    const startedAt = Date.now();
    const realProvidersEnabled = process.env.AI_REAL_PROVIDERS_ENABLED === 'true';
    if (!realProvidersEnabled) {
      throw new BadRequestException({ code: 'AI_PROVIDER_DISABLED', message: 'AI provider disabled' });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new BadRequestException({ code: 'AI_PROVIDER_NOT_CONFIGURED', message: 'AI provider not configured' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS || 15000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: this.buildInput(input),
        }),
      });

      if (!response.ok) {
        throw new BadRequestException({ code: 'AI_PROVIDER_REQUEST_FAILED', message: 'AI provider request failed' });
      }

      const data = await response.json() as any;
      return {
        provider: this.provider,
        model,
        responseText: this.extractText(data),
        status: 'completed',
        latencyMs: Date.now() - startedAt,
        tokenUsage: this.extractUsage(data),
        rawMetadata: { responseId: data?.id, model: data?.model || model },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error?.name === 'AbortError') {
        throw new BadRequestException({ code: 'AI_PROVIDER_TIMEOUT', message: 'AI provider timeout' });
      }
      throw new BadRequestException({ code: 'AI_PROVIDER_REQUEST_FAILED', message: 'AI provider request failed' });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildInput(input: AiProviderInput) {
    const product = input.product;
    return [
      'You are answering an ecommerce discovery prompt.',
      'Return a concise product recommendation response.',
      `Prompt: ${input.promptText}`,
      `Language: ${input.language}`,
      `Country: ${input.country}`,
      `Product title: ${product.title || ''}`,
      `Brand: ${product.brand || ''}`,
      `Category: ${product.category || product.productType || ''}`,
      `Description: ${product.description || ''}`,
    ].join('\n');
  }

  private extractText(data: any): string {
    if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
    const text = data?.output?.flatMap((item: any) => item?.content || [])
      .map((content: any) => content?.text)
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) return text;
    throw new BadRequestException({ code: 'AI_PROVIDER_REQUEST_FAILED', message: 'AI provider returned no text' });
  }

  private extractUsage(data: any): Record<string, number> | undefined {
    if (!data?.usage) return undefined;
    return {
      inputTokens: Number(data.usage.input_tokens || 0),
      outputTokens: Number(data.usage.output_tokens || 0),
      totalTokens: Number(data.usage.total_tokens || 0),
    };
  }
}
