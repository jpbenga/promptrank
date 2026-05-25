import { BadRequestException } from '@nestjs/common';
import { ProductsService } from '../products.service';

describe('ProductsService', () => {
  test('price conversion', () => {
    const s = new ProductsService({} as any);
    expect(s.parsePrice('24.90')).toBe(24.9);
    expect(s.parsePrice('39,99')).toBe(39.99);
    expect(s.parsePrice('12,50 €')).toBe(12.5);
  });
  test('availability normalization', () => {
    const s = new ProductsService({} as any);
    expect(s.normalizeAvailability('in_stock')).toBe('in_stock');
    expect(s.normalizeAvailability('in stock')).toBe('in_stock');
    expect(s.normalizeAvailability('disponible')).toBe('in_stock');
    expect(s.normalizeAvailability('oui')).toBe('in_stock');
    expect(s.normalizeAvailability('available')).toBe('in_stock');
    expect(s.normalizeAvailability('out_of_stock')).toBe('out_of_stock');
    expect(s.normalizeAvailability('out of stock')).toBe('out_of_stock');
    expect(s.normalizeAvailability('indisponible')).toBe('out_of_stock');
    expect(s.normalizeAvailability('non')).toBe('out_of_stock');
    expect(s.normalizeAvailability('false')).toBe('out_of_stock');
    expect(s.normalizeAvailability('preorder')).toBe('preorder');
    expect(s.normalizeAvailability('pre_order')).toBe('preorder');
    expect(s.normalizeAvailability('précommande')).toBe('preorder');
    expect(s.normalizeAvailability('later')).toBe('unknown');
  });
  test('array transforms', () => { const s = new ProductsService({} as any); expect(s.toArray('a;b|c')?.length).toBe(3); });
  test('import validates missing title and attributes', async () => {
    const creates: any[] = [];
    const prisma: any = { csvColumnMapping: { findFirst: async () => ({ csvImportId: 'i1', mapping: { Name: 'title', Price: 'price' }, createdAt: new Date() }) }, csvImport: { findUnique: async () => ({ rows: [{ Name: '', Price: '12', Extra: 'x' }, { Name: 'A', Price: '12', Extra: 'x' }] }) }, product: { create: async ({ data }: any) => creates.push(data), findMany: async () => [] } };
    const s = new ProductsService(prisma);
    const result = await s.import('p1');
    expect(result.skippedCount).toBe(1);
    expect(result.errors).toContain('Missing title');
    expect(creates).toHaveLength(1);
    expect(creates[0].attributes.Extra).toBe('x');
    expect(creates[0].rawSource).toEqual({ Name: 'A', Price: '12', Extra: 'x' });
  });
  test('complete import uses csv column to normalized field mapping', async () => {
    const creates: any[] = [];
    const mapping = {
      nom_produit: 'title',
      description_longue: 'description',
      prix_ttc: 'price',
      sku: 'sku',
      marque: 'brand',
      categorie: 'category',
      url_fiche: 'url',
      stock: 'availability',
      ean13: 'gtin',
      image_url: 'imageUrls',
      mots_cles: 'tags',
    };
    const prisma: any = {
      csvColumnMapping: { findFirst: async () => ({ csvImportId: 'i1', mapping, createdAt: new Date() }) },
      csvImport: {
        findUnique: async () => ({
          rows: [{
            nom_produit: 'Gourde inox 750 ml',
            description_longue: 'Gourde isotherme en acier inoxydable 750 ml',
            prix_ttc: '24,90',
            sku: 'GOU-750-INOX',
            marque: 'HydraPlus',
            categorie: 'Hydratation',
            url_fiche: 'https://example.com/gourde-750',
            stock: 'disponible',
            ean13: '3760123456789',
            image_url: 'https://example.com/images/gourde.jpg',
            mots_cles: 'gourde;inox;isotherme',
            couleur: 'bleu',
            matiere: 'acier inoxydable',
            capacite: '750 ml',
          }],
        }),
      },
      product: { create: async ({ data }: any) => creates.push(data), findMany: async () => [] },
    };
    const s = new ProductsService(prisma);
    const result = await s.import('p1');
    expect(result.importedCount).toBe(1);
    expect(creates[0].title).toBe('Gourde inox 750 ml');
    expect(creates[0].description).toBe('Gourde isotherme en acier inoxydable 750 ml');
    expect(creates[0].price).toBe(24.9);
    expect(creates[0].sku).toBe('GOU-750-INOX');
    expect(creates[0].brand).toBe('HydraPlus');
    expect(creates[0].category).toBe('Hydratation');
    expect(creates[0].url).toBe('https://example.com/gourde-750');
    expect(creates[0].availability).toBe('in_stock');
    expect(creates[0].gtin).toBe('3760123456789');
    expect(creates[0].imageUrls).toEqual(['https://example.com/images/gourde.jpg']);
    expect(creates[0].tags).toEqual(['gourde', 'inox', 'isotherme']);
    expect(creates[0].attributes.couleur).toBe('bleu');
    expect(creates[0].attributes.matiere).toBe('acier inoxydable');
    expect(creates[0].attributes.capacite).toBe('750 ml');
    expect(creates[0].rawSource.prix_ttc).toBe('24,90');
  });
  test('product import failed code', async () => {
    const s = new ProductsService({ csvColumnMapping: { findFirst: async () => { throw new Error('x'); } } } as any);
    await expect(s.import('p1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
