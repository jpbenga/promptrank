import { BadRequestException } from '@nestjs/common';
import { AiProviderOrchestratorService } from '../ai-provider.service';
import { MockAiProvider } from '../mock-ai.provider';
import { OpenAiProvider } from '../openai.provider';

const input = {
  projectId: 'project-1',
  productId: 'product-1',
  promptId: 'prompt-1',
  promptText: 'best bottle',
  language: 'en',
  country: 'US',
  product: { id: 'product-1', title: 'Gourde Inox', brand: 'HydroPeak' },
};

async function expectCode(promise: Promise<unknown>, expectedCode: string) {
  try {
    await promise;
    throw new Error('Expected provider to reject');
  } catch (error) {
    expect((error as BadRequestException).getResponse()).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}

describe('AiProviderOrchestratorService', () => {
  const mockProvider = new MockAiProvider();
  const openAiProvider = new OpenAiProvider();
  const service = new AiProviderOrchestratorService(mockProvider, openAiProvider);
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.AI_PROVIDER_DEFAULT;
    process.env.AI_REAL_PROVIDERS_ENABLED = 'false';
    process.env.OPENAI_API_KEY = '';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses mock when provider is absent', async () => {
    const response = await service.generateResponse(input);
    expect(response.provider).toBe('mock');
    expect(response.model).toBe('mock-v1');
    expect(response.responseText.length).toBeGreaterThan(0);
  });

  it('uses mock when provider is mock', async () => {
    const response = await service.generateResponse(input, 'mock');
    expect(response.provider).toBe('mock');
  });

  it('rejects unsupported providers', async () => {
    await expect(service.generateResponse(input, 'gemini')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_PROVIDER_UNSUPPORTED' }),
    });
  });
});

describe('OpenAiProvider', () => {
  const provider = new OpenAiProvider();
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.AI_REAL_PROVIDERS_ENABLED = 'false';
    process.env.OPENAI_API_KEY = '';
    process.env.OPENAI_MODEL = 'gpt-test';
    process.env.AI_REQUEST_TIMEOUT_MS = '5';
    global.fetch = jest.fn() as any;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('returns AI_PROVIDER_DISABLED when real providers are disabled', async () => {
    await expectCode(provider.generateResponse(input), 'AI_PROVIDER_DISABLED');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns AI_PROVIDER_NOT_CONFIGURED when enabled without an API key', async () => {
    process.env.AI_REAL_PROVIDERS_ENABLED = 'true';
    process.env.OPENAI_API_KEY = '';
    await expectCode(provider.generateResponse(input), 'AI_PROVIDER_NOT_CONFIGURED');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('maps AbortError to AI_PROVIDER_TIMEOUT', async () => {
    process.env.AI_REAL_PROVIDERS_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expectCode(provider.generateResponse(input), 'AI_PROVIDER_TIMEOUT');
  });

  it('maps provider failures to AI_PROVIDER_REQUEST_FAILED', async () => {
    process.env.AI_REAL_PROVIDERS_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-key';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network failed'));
    await expectCode(provider.generateResponse(input), 'AI_PROVIDER_REQUEST_FAILED');
  });

  it('does not log the API key', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    process.env.AI_REAL_PROVIDERS_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'secret-test-key';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network failed'));
    await expect(provider.generateResponse(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
