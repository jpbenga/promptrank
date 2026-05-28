import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PromptsService } from '../prompts.service';

describe('PromptsService', () => {
  const prisma: any = {
    project: { findUnique: jest.fn() },
    product: { findMany: jest.fn() },
    productPrompt: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    promptRun: { create: jest.fn() },
  };
  const aiProviders: any = { generateResponse: jest.fn() };
  const service = new PromptsService(prisma, aiProviders);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findUnique.mockResolvedValue({ id: 'p1', primaryLanguage: 'fr', targetCountry: 'FR' });
    prisma.productPrompt.create.mockImplementation(({ data }: any) => Promise.resolve({ id: `pp-${data.position}`, ...data }));
    aiProviders.generateResponse.mockResolvedValue({ provider: 'mock', model: 'mock-v1', responseText: 'HydroPeak Gourde Inox est recommandée.', status: 'completed' });
    prisma.promptRun.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'run-1', createdAt: new Date(), updatedAt: new Date(), ...data }));
  });

  it('generates 5 prompts/product in FR and no BPA when absent', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'a1', productType: 'gourde', brand: 'Stanley', tags: [] }]);
    const res = await service.generate('p1', { productIds: ['a1'] });
    expect(res.generatedCount).toBe(5);
    expect(res.promptsByProduct.a1).toHaveLength(5);
    expect(res.promptsByProduct.a1[0].text).toContain('meilleur');
    expect(res.promptsByProduct.a1.map(x => x.text).join(' ')).not.toContain('sans BPA');
  });

  it('generates EN prompts', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'a1', productType: 'bottle', brand: 'Stanley' }]);
    const res = await service.generate('p1', { productIds: ['a1'], language: 'en' });
    expect(res.promptsByProduct.a1[0].text).toContain('best');
  });

  it('adds BPA only when present', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'a1', productType: 'bottle', brand: 'X', description: 'BPA free' }]);
    const res = await service.generate('p1', { productIds: ['a1'], language: 'en' });
    expect(res.promptsByProduct.a1.map(x => x.text).join(' ')).toContain('BPA-free');
  });

  it('enforces limits and errors', async () => {
    await expect(service.generate('p1', { productIds: [] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.generate('p1', { productIds: ['1','2','3','4','5','6'] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.generate('p1', { productIds: ['1'], promptsPerProduct: 6 })).rejects.toBeInstanceOf(BadRequestException);
    prisma.product.findMany.mockResolvedValue(['1','2','3','4','5'].map(id => ({ id, productType: 'gourde', brand: 'Marque' })));
    await expect(service.generate('p1', { productIds: ['1','2','3','4','5'], promptsPerProduct: 5 })).resolves.toMatchObject({ generatedCount: 25 });
  });

  it('throws PROJECT_NOT_FOUND', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null);
    await expect(service.generate('bad', { productIds: ['a1'] })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws PRODUCT_NOT_FOUND when outside project', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await expect(service.generate('p1', { productIds: ['a1'] })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update sets edited + manual on text change', async () => {
    prisma.productPrompt.findFirst.mockResolvedValue({ id: 'pr1', projectId: 'p1', text: 'old', source: 'template' });
    prisma.productPrompt.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'pr1', ...data }));
    const out = await service.update('p1', 'pr1', { text: 'new' });
    expect(out.status).toBe('edited');
    expect(out.source).toBe('manual');
  });

  it('delete disables and list excludes disabled', async () => {
    prisma.productPrompt.findFirst.mockResolvedValue({ id: 'pr1', projectId: 'p1' });
    prisma.productPrompt.update.mockResolvedValue({ id: 'pr1', status: 'disabled' });
    prisma.productPrompt.findMany.mockResolvedValue([{ id: 'pr2', status: 'proposed' }]);
    const out = await service.remove('p1', 'pr1');
    expect(out.status).toBe('disabled');
    const listed = await service.listProject('p1');
    expect(listed.every((p: any) => p.status !== 'disabled')).toBe(true);
  });

  it('analyzes with default provider and stores provider/model', async () => {
    const prompt = { id: 'prompt-1', projectId: 'p1', productId: 'product-1', text: 'prompt', language: 'fr', country: 'FR', intent: 'best', source: 'template', status: 'proposed', position: 0, createdAt: new Date(), updatedAt: new Date() };
    prisma.productPrompt.findMany.mockResolvedValue([prompt]);
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', title: 'Gourde Inox', brand: 'HydroPeak' }]);

    const response = await service.analyze('p1', { promptIds: ['prompt-1'] });

    expect(aiProviders.generateResponse).toHaveBeenCalledWith(expect.objectContaining({ promptId: 'prompt-1' }), undefined);
    expect(prisma.promptRun.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ provider: 'mock', model: 'mock-v1' }),
    }));
    expect(response.results[0].run.provider).toBe('mock');
    expect(response.results[0].run.model).toBe('mock-v1');
  });

  it('stores an explicit openai provider/model returned by the provider layer', async () => {
    const prompt = { id: 'prompt-1', projectId: 'p1', productId: 'product-1', text: 'prompt', language: 'fr', country: 'FR', intent: 'best', source: 'template', status: 'proposed', position: 0, createdAt: new Date(), updatedAt: new Date() };
    aiProviders.generateResponse.mockResolvedValueOnce({ provider: 'openai', model: 'gpt-test', responseText: 'HydroPeak Gourde Inox est recommandée.', status: 'completed' });
    prisma.productPrompt.findMany.mockResolvedValue([prompt]);
    prisma.product.findMany.mockResolvedValue([{ id: 'product-1', title: 'Gourde Inox', brand: 'HydroPeak' }]);

    const response = await service.analyze('p1', { promptIds: ['prompt-1'], provider: 'openai' });

    expect(aiProviders.generateResponse).toHaveBeenCalledWith(expect.objectContaining({ promptId: 'prompt-1' }), 'openai');
    expect(prisma.promptRun.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ provider: 'openai', model: 'gpt-test' }),
    }));
    expect(response.results[0].run.provider).toBe('openai');
    expect(response.results[0].run.model).toBe('gpt-test');
  });
});
