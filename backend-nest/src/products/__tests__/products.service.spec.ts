import { BadRequestException } from '@nestjs/common';
import { ProductsService } from '../products.service';

describe('ProductsService', () => {
  test('price conversion', () => { const s = new ProductsService({} as any); expect(s.parsePrice('12,50 €')).toBe(12.5); });
  test('availability normalization', () => { const s = new ProductsService({} as any); expect(s.normalizeAvailability('in stock')).toBe('in_stock'); });
  test('array transforms', () => { const s = new ProductsService({} as any); expect(s.toArray('a;b|c')?.length).toBe(3); });
  test('import validates missing title and attributes', async () => {
    const creates: any[] = [];
    const prisma: any = { csvColumnMapping: { findFirst: async () => ({ csvImportId: 'i1', mapping: { Name: 'title', Price: 'price' }, createdAt: new Date() }) }, csvImport: { findUnique: async () => ({ rows: [{ Name: '', Price: '12', Extra: 'x' }, { Name: 'A', Price: '12', Extra: 'x' }] }) }, product: { create: async ({ data }: any) => creates.push(data), findMany: async () => [] } };
    const s = new ProductsService(prisma);
    const result = await s.import('p1');
    expect(result.skippedCount).toBe(1);
    expect(creates[0].attributes.Extra).toBe('x');
  });
  test('product import failed code', async () => {
    const s = new ProductsService({ csvColumnMapping: { findFirst: async () => { throw new Error('x'); } } } as any);
    await expect(s.import('p1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
