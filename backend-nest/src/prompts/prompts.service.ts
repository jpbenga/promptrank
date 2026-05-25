import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { GeneratePromptsRequest, GeneratePromptsResponse, ProductPrompt, PromptIntent, PromptSource, PromptStatus, UpdatePromptRequest } from '@promptrank/shared-types';
import { PrismaService } from '../common/prisma.service';

type ProductRecord = {
  id: string;
  title?: string | null;
  description?: string | null;
  brand?: string | null;
  productType?: string | null;
  category?: string | null;
  tags?: unknown;
  attributes?: unknown;
};

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly maxProducts = 5;
  private readonly maxPromptsPerProduct = 5;

  private containsBpa(data: ProductRecord): boolean {
    const attrs = data.attributes && typeof data.attributes === 'object' ? Object.values(data.attributes as Record<string, unknown>).map(String) : [];
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const text = [data.title, data.description, ...tags, ...attrs].filter(Boolean).join(' ').toLowerCase();
    return text.includes('bpa');
  }

  private template(product: ProductRecord, language: 'fr' | 'en', country: string): { text: string; intent: PromptIntent }[] {
    const noun = (product.productType || product.category || 'product').toLowerCase();
    const brand = product.brand || 'brand';
    const fr: { text: string; intent: PromptIntent }[] = [
      { intent: 'best', text: `meilleur ${noun} pour ${country === 'FR' ? 'usage quotidien' : 'e-commerce'}` },
      { intent: 'cheap', text: `${noun} pas cher` },
      { intent: 'alternative', text: `alternative moins chère à ${brand}` },
      { intent: 'use_case', text: `quel ${noun} choisir pour ${product.category || 'un bon rapport qualité prix'}` },
      { intent: 'comparison', text: `comparatif ${noun} ${brand}` },
    ];
    const en: { text: string; intent: PromptIntent }[] = [
      { intent: 'best', text: `best ${noun} for everyday use` },
      { intent: 'cheap', text: `affordable ${noun}` },
      { intent: 'alternative', text: `cheaper alternative to ${brand}` },
      { intent: 'use_case', text: `which ${noun} should I choose` },
      { intent: 'comparison', text: `${noun} comparison ${brand}` },
    ];
    const base = language === 'fr' ? fr : en;
    if (this.containsBpa(product)) {
      base[4] = { intent: 'use_case', text: language === 'fr' ? `${noun} sans BPA` : `BPA-free ${noun}` };
    }
    return base.map(item => ({ ...item, text: item.text.replace(/\s+/g, ' ').trim() }));
  }

  async generate(projectId: string, body: GeneratePromptsRequest): Promise<GeneratePromptsResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Project not found' });

    const productIds = body.productIds || [];
    if (!productIds.length) throw new BadRequestException({ code: 'PROMPT_GENERATION_NO_PRODUCTS', message: 'No products selected' });

    const requestedPerProduct = Number(body.promptsPerProduct || 5);
    const promptsPerProduct = Math.min(this.maxPromptsPerProduct, Math.max(1, requestedPerProduct));
    if (productIds.length > this.maxProducts || requestedPerProduct > this.maxPromptsPerProduct || productIds.length * promptsPerProduct > 25) {
      throw new BadRequestException({ code: 'PROMPT_GENERATION_LIMIT_EXCEEDED', message: 'Limit exceeded' });
    }

    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, projectId } }) as ProductRecord[];
    if (products.length !== productIds.length) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });

    const language: 'fr' | 'en' = (body.language || project.primaryLanguage || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
    const country = body.country || project.targetCountry || 'FR';

    const promptsByProduct: Record<string, ProductPrompt[]> = {};
    let generatedCount = 0;

    for (const product of products) {
      const templates = this.template(product, language, country).slice(0, promptsPerProduct);
      const dedup = Array.from(new Map(templates.map(t => [t.text.toLowerCase(), t])).values());
      const created = await Promise.all(
        dedup.map((tpl, idx) => this.prisma.productPrompt.create({
          data: {
            projectId,
            productId: product.id,
            text: tpl.text,
            language,
            country,
            intent: tpl.intent,
            source: 'template' as PromptSource,
            status: 'proposed' as PromptStatus,
            position: idx,
          },
        })),
      ) as ProductPrompt[];
      promptsByProduct[product.id] = created;
      generatedCount += created.length;
    }

    return { promptsByProduct, generatedCount };
  }

  listProject(projectId: string): Promise<ProductPrompt[]> {
    return this.prisma.productPrompt.findMany({ where: { projectId, status: { not: 'disabled' } }, orderBy: [{ productId: 'asc' }, { position: 'asc' }] });
  }

  listProduct(projectId: string, productId: string): Promise<ProductPrompt[]> {
    return this.prisma.productPrompt.findMany({ where: { projectId, productId, status: { not: 'disabled' } }, orderBy: { position: 'asc' } });
  }

  async update(projectId: string, promptId: string, body: UpdatePromptRequest): Promise<ProductPrompt> {
    const prompt = await this.prisma.productPrompt.findFirst({ where: { id: promptId, projectId } });
    if (!prompt) throw new NotFoundException({ code: 'PROMPT_NOT_FOUND', message: 'Prompt not found' });
    if (!body.text && !body.status) throw new BadRequestException({ code: 'PROMPT_UPDATE_INVALID', message: 'Invalid update' });
    const source: PromptSource = body.text && body.text !== prompt.text ? 'manual' : prompt.source as PromptSource;
    return this.prisma.productPrompt.update({ where: { id: promptId }, data: { text: body.text ?? prompt.text, status: body.status ?? 'edited', source } });
  }

  async remove(projectId: string, promptId: string): Promise<ProductPrompt> {
    const prompt = await this.prisma.productPrompt.findFirst({ where: { id: promptId, projectId } });
    if (!prompt) throw new NotFoundException({ code: 'PROMPT_NOT_FOUND', message: 'Prompt not found' });
    return this.prisma.productPrompt.update({ where: { id: promptId }, data: { status: 'disabled' } });
  }
}
