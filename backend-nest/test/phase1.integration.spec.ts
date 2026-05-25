import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

describe('Phase 1 CSV API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const fixturePath = join(__dirname, 'fixtures', 'products-phase1.csv');

  async function cleanDatabase() {
    await prisma.product.deleteMany();
    await prisma.csvColumnMapping.deleteMany();
    await prisma.csvImport.deleteMany();
    await prisma.project.deleteMany();
  }

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for integration tests.');
    }
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase();
  });

  beforeEach(async () => cleanDatabase());
  afterAll(async () => {
    if (prisma) await cleanDatabase();
    if (app) await app.close();
  });

  it('runs the complete CSV phase 1 flow against the test database', async () => {
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Phase 1 fixture', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' })
      .expect(201);

    const projectId = projectRes.body.id;
    expect(projectId).toBeTruthy();

    const uploadRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/csv/upload`)
      .attach('file', readFileSync(fixturePath), 'products-phase1.csv')
      .expect(201);

    expect(uploadRes.body.columns).toEqual([
      'nom_produit',
      'description_longue',
      'prix_ttc',
      'sku',
      'marque',
      'categorie',
      'url_fiche',
      'stock',
      'ean13',
      'image_url',
      'mots_cles',
      'couleur',
      'matiere',
      'capacite',
    ]);
    expect(uploadRes.body.previewRows).toHaveLength(8);
    expect(uploadRes.body.rowCount).toBe(8);

    const mappingRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/csv/mapping`)
      .send({ csvImportId: uploadRes.body.id })
      .expect(201);

    expect(mappingRes.body.mapping).toMatchObject({
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
    });

    const importRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/csv/import`)
      .send({})
      .expect(201);

    expect(importRes.body.importedCount).toBe(8);
    expect(importRes.body.skippedCount).toBe(0);
    expect(importRes.body.errors).toEqual([]);

    const productsRes = await request(app.getHttpServer())
      .get(`/projects/${projectId}/products`)
      .expect(200);

    expect(productsRes.body).toHaveLength(8);
    const product = productsRes.body.find((item: any) => item.sku === 'GOU-750-INOX');
    expect(product).toMatchObject({
      title: 'Gourde inox 750 ml',
      sku: 'GOU-750-INOX',
      brand: 'HydraPlus',
      category: 'Hydratation',
      price: 24.9,
      currency: 'EUR',
      availability: 'in_stock',
      url: 'https://example.com/gourde-750',
      gtin: '3760123456789',
    });
    expect(product.description).toContain('Gourde isotherme');
    expect(product.imageUrls).toEqual(['https://example.com/images/gourde.jpg']);
    expect(product.tags).toEqual(['gourde', 'inox', 'isotherme']);
    expect(product.rawSource.prix_ttc).toBe('24,90');
    expect(product.attributes).toMatchObject({
      couleur: 'bleu',
      matiere: 'acier inoxydable',
      capacite: '750 ml',
    });
    expect(productsRes.body.some((item: any) => item.price === null || item.price === undefined)).toBe(false);
    expect(productsRes.body.some((item: any) => !item.url)).toBe(false);
    expect(productsRes.body.map((item: any) => item.availability)).toEqual(
      expect.arrayContaining(['in_stock', 'out_of_stock', 'preorder']),
    );
  });

  it('rejects mappings without title with a structured error', async () => {
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'Invalid mapping fixture', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' })
      .expect(201);

    const uploadRes = await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/csv/upload`)
      .attach('file', readFileSync(fixturePath), 'products-phase1.csv')
      .expect(201);

    const response = await request(app.getHttpServer())
      .post(`/projects/${projectRes.body.id}/csv/mapping`)
      .send({ csvImportId: uploadRes.body.id, mapping: { prix_ttc: 'price' } })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'CSV_MAPPING_MISSING_TITLE',
    });
  });
});
