import { BadRequestException } from '@nestjs/common';
import { MockShopifyClient } from '../mock-shopify.client';
import { ShopifyService } from '../shopify.service';
import { normalizeShopifyProduct } from '../shopify-normalizer';

const now = new Date('2026-05-29T12:00:00.000Z');
const project = { id: 'project-1', currency: 'EUR' };
const connection = {
  id: 'conn-1',
  projectId: project.id,
  shopDomain: 'demo.myshopify.com',
  accessTokenMasked: null,
  mode: 'mock',
  status: 'connected',
  lastSyncAt: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
};

function createPrismaMock() {
  return {
    project: { findUnique: jest.fn().mockResolvedValue(project) },
    shopifyConnection: {
      upsert: jest.fn().mockResolvedValue(connection),
      findUnique: jest.fn().mockResolvedValue(connection),
      create: jest.fn().mockResolvedValue(connection),
      update: jest.fn().mockResolvedValue({ ...connection, status: 'synced', lastSyncAt: now }),
    },
    product: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn((args) => Promise.resolve({ id: 'product-created', createdAt: now, updatedAt: now, ...args.data })),
      update: jest.fn((args) => Promise.resolve({ id: args.where.id, createdAt: now, updatedAt: now, ...args.data })),
    },
  };
}

async function expectCode(promise: Promise<unknown>, expectedCode: string) {
  try {
    await promise;
    throw new Error('Expected Shopify service to reject');
  } catch (error) {
    expect((error as BadRequestException).getResponse()).toEqual(expect.objectContaining({ code: expectedCode }));
  }
}

describe('ShopifyService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv, SHOPIFY_REAL_SYNC_ENABLED: 'false', SHOPIFY_SYNC_MODE: 'mock' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('validates Shopify domains', async () => {
    const service = new ShopifyService(createPrismaMock() as any, new MockShopifyClient());
    await expectCode(service.configure(project.id, { shopDomain: 'not-shopify.test', mode: 'mock' }), 'SHOPIFY_INVALID_DOMAIN');
  });

  it('configures a mock connection without exposing a raw token', async () => {
    const prisma = createPrismaMock();
    const service = new ShopifyService(prisma as any, new MockShopifyClient());
    const result = await service.configure(project.id, { shopDomain: 'Demo.myshopify.com', mode: 'mock' });
    expect(prisma.shopifyConnection.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ shopDomain: 'demo.myshopify.com', mode: 'mock' }),
    }));
    expect(result.connection).toEqual(expect.objectContaining({ shopDomain: 'demo.myshopify.com', mode: 'mock', accessTokenMasked: null }));
    expect(JSON.stringify(result)).not.toContain('accessTokenEncrypted');
  });

  it('rejects real mode when real sync is disabled', async () => {
    const service = new ShopifyService(createPrismaMock() as any, new MockShopifyClient());
    await expectCode(service.configure(project.id, { shopDomain: 'demo.myshopify.com', mode: 'real' }), 'SHOPIFY_REAL_SYNC_DISABLED');
  });

  it('creates Shopify products with source=shopify during sync', async () => {
    const prisma = createPrismaMock();
    const service = new ShopifyService(prisma as any, new MockShopifyClient());
    const result = await service.sync(project.id);
    expect(result.importedCount).toBeGreaterThan(0);
    expect(result.updatedCount).toBe(0);
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ source: 'shopify', projectId: project.id, externalId: 'gid://shopify/Product/1001' }),
    }));
    expect(result.products[0].source).toBe('shopify');
  });

  it('updates existing products with the same Shopify external id or SKU', async () => {
    const prisma = createPrismaMock();
    prisma.product.findFirst.mockResolvedValue({ id: 'existing-product' });
    const service = new ShopifyService(prisma as any, new MockShopifyClient());
    const result = await service.sync(project.id);
    expect(result.importedCount).toBe(0);
    expect(result.updatedCount).toBeGreaterThan(0);
    expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'existing-product' } }));
  });
});

describe('MockShopifyClient and normalizer', () => {
  it('returns deterministic mock products', async () => {
    const client = new MockShopifyClient();
    const first = await client.listProducts('demo.myshopify.com');
    const second = await client.listProducts('demo.myshopify.com');
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(5);
    expect(first.map(product => product.title)).toContain('Gourde inox isotherme 750ml');
  });

  it('normalizes price, SKU, vendor, category, URL, images, tags, availability, GTIN and rawSource', async () => {
    const [shopifyProduct] = await new MockShopifyClient().listProducts('demo.myshopify.com');
    const normalized = normalizeShopifyProduct(shopifyProduct, 'demo.myshopify.com', 'EUR');
    expect(normalized).toEqual(expect.objectContaining({
      source: 'shopify',
      externalId: shopifyProduct.id,
      sku: 'HP-BTL-750',
      brand: 'HydroPeak',
      vendor: 'HydroPeak',
      category: 'Hydration',
      productType: 'Hydration',
      price: 29.9,
      currency: 'EUR',
      availability: 'in_stock',
      url: 'https://demo.myshopify.com/products/gourde-inox-isotherme-750ml',
      gtin: '3760000000011',
      rawSource: shopifyProduct,
    }));
    expect(normalized.imageUrls).toEqual(['https://cdn.shopify.mock/products/gourde-inox.jpg']);
    expect(normalized.tags).toEqual(['gourde', 'inox', 'randonnée', 'sport']);
  });
});
