import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(__dirname, '../../.env'));
loadEnvFile(resolve(__dirname, '../../.env.example'));

jest.setTimeout(60000);

describe('Phase 7A Shopify mock connector', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanDatabase() {
    await prisma.shopifyConnection.deleteMany();
    await prisma.actionCard.deleteMany();
    await prisma.visibilityScore.deleteMany();
    await prisma.promptRun.deleteMany();
    await prisma.productPrompt.deleteMany();
    await prisma.product.deleteMany();
    await prisma.project.deleteMany();
  }

  async function createProject() {
    return prisma.project.create({
      data: { name: 'p7 shopify', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
  }

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for integration tests.');
    }
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.SHOPIFY_SYNC_MODE = 'mock';
    process.env.SHOPIFY_REAL_SYNC_ENABLED = 'false';

    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase();
  });

  beforeEach(async () => {
    process.env.SHOPIFY_SYNC_MODE = 'mock';
    process.env.SHOPIFY_REAL_SYNC_ENABLED = 'false';
    await cleanDatabase();
  });

  afterAll(async () => {
    if (prisma) await cleanDatabase();
    if (app) await app.close();
  });

  it('configures mock Shopify, syncs products and exposes them through the products endpoint', async () => {
    const project = await createProject();

    const configured = await request(app.getHttpServer())
      .post(`/projects/${project.id}/shopify/config`)
      .send({ shopDomain: 'demo.myshopify.com', mode: 'mock' })
      .expect(201);

    expect(configured.body.connection).toEqual(expect.objectContaining({
      projectId: project.id,
      shopDomain: 'demo.myshopify.com',
      mode: 'mock',
      status: 'connected',
    }));
    expect(JSON.stringify(configured.body)).not.toContain('accessTokenEncrypted');

    const status = await request(app.getHttpServer())
      .get(`/projects/${project.id}/shopify/status`)
      .expect(200);
    expect(status.body.connection.status).toBe('connected');

    const synced = await request(app.getHttpServer())
      .post(`/projects/${project.id}/shopify/sync`)
      .send({})
      .expect(201);

    expect(synced.body.importedCount).toBeGreaterThan(0);
    expect(synced.body.updatedCount).toBe(0);
    expect(synced.body.skippedCount).toBe(0);
    expect(synced.body.connection.status).toBe('synced');
    expect(synced.body.products[0]).toEqual(expect.objectContaining({
      source: 'shopify',
      price: expect.any(Number),
      url: expect.stringContaining('https://demo.myshopify.com/products/'),
      imageUrls: expect.any(Array),
      tags: expect.any(Array),
      rawSource: expect.any(Object),
    }));

    const products = await request(app.getHttpServer())
      .get(`/projects/${project.id}/products`)
      .expect(200);
    expect(products.body.length).toBe(synced.body.importedCount);
    expect(products.body.every((product: any) => product.source === 'shopify')).toBe(true);
    expect(products.body[0].rawSource).toBeTruthy();

    const syncedAgain = await request(app.getHttpServer())
      .post(`/projects/${project.id}/shopify/sync`)
      .send({})
      .expect(201);
    expect(syncedAgain.body.importedCount).toBe(0);
    expect(syncedAgain.body.updatedCount).toBeGreaterThan(0);
  });

  it('returns SHOPIFY_INVALID_DOMAIN for invalid domains', async () => {
    const project = await createProject();
    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/shopify/config`)
      .send({ shopDomain: 'example.com', mode: 'mock' })
      .expect(400);
    expect(res.body.code).toBe('SHOPIFY_INVALID_DOMAIN');
  });

  it('returns SHOPIFY_REAL_SYNC_DISABLED for real mode while disabled', async () => {
    const project = await createProject();
    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/shopify/config`)
      .send({ shopDomain: 'demo.myshopify.com', mode: 'real' })
      .expect(400);
    expect(res.body.code).toBe('SHOPIFY_REAL_SYNC_DISABLED');
  });
});
