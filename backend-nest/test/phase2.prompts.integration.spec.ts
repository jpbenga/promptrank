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

describe('Phase 2 prompts integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanDatabase() {
    await prisma.productPrompt.deleteMany();
    await prisma.product.deleteMany();
    await prisma.csvColumnMapping.deleteMany();
    await prisma.csvImport.deleteMany();
    await prisma.project.deleteMany();
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase();
  });

  beforeEach(async () => cleanDatabase());
  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  it('generates, lists, updates and disables prompts for 3 products', async () => {
    const project = await prisma.project.create({ data: { name: 'P2', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' } });
    const products = await Promise.all([1,2,3].map(i => prisma.product.create({ data: { projectId: project.id, source: 'csv', title: `Produit ${i}`, productType: 'gourde', brand: 'Marque' } })));

    const generate = await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/generate`).send({ productIds: products.map(p => p.id), promptsPerProduct: 5, language: 'fr', country: 'FR' }).expect(201);
    expect(generate.body.generatedCount).toBe(15);

    const listProject = await request(app.getHttpServer()).get(`/projects/${project.id}/prompts`).expect(200);
    expect(listProject.body).toHaveLength(15);
    expect(listProject.body[0]).toEqual(expect.objectContaining({ id: expect.any(String), projectId: project.id, productId: expect.any(String), text: expect.any(String), language: 'fr', country: 'FR', intent: expect.any(String), source: expect.any(String), status: expect.any(String), position: expect.any(Number) }));

    const listProduct = await request(app.getHttpServer()).get(`/projects/${project.id}/products/${products[0].id}/prompts`).expect(200);
    expect(listProduct.body).toHaveLength(5);

    const promptId = listProject.body[0].id;
    const patch = await request(app.getHttpServer()).patch(`/projects/${project.id}/prompts/${promptId}`).send({ text: 'prompt édité' }).expect(200);
    expect(patch.body.status).toBe('edited');
    expect(patch.body.source).toBe('manual');

    await request(app.getHttpServer()).delete(`/projects/${project.id}/prompts/${promptId}`).expect(200);
    const refreshed = await request(app.getHttpServer()).get(`/projects/${project.id}/prompts`).expect(200);
    expect(refreshed.body.some((p: any) => p.id === promptId)).toBe(false);
  });

  it('returns errors for invalid generation/update/delete inputs', async () => {
    const project = await prisma.project.create({ data: { name: 'P2', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' } });
    const p = await prisma.product.create({ data: { projectId: project.id, source: 'csv', title: 'Produit', productType: 'gourde' } });
    const otherProject = await prisma.project.create({ data: { name: 'Other', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' } });
    const other = await prisma.product.create({ data: { projectId: otherProject.id, source: 'csv', title: 'Other' } });

    await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/generate`).send({ productIds: [] }).expect(400);
    await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/generate`).send({ productIds: [p.id,p.id,p.id,p.id,p.id,p.id] }).expect(400);
    await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/generate`).send({ productIds: [p.id], promptsPerProduct: 6 }).expect(400);
    await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/generate`).send({ productIds: [other.id] }).expect(404);
    await request(app.getHttpServer()).patch(`/projects/${project.id}/prompts/not-found`).send({ text: 'x' }).expect(404);
    await request(app.getHttpServer()).delete(`/projects/${project.id}/prompts/not-found`).expect(404);
  });
});
