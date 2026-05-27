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

describe('Phase 3 prompt runs', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanDatabase() {
    await prisma.promptRun.deleteMany();
    await prisma.productPrompt.deleteMany();
    await prisma.product.deleteMany();
    await prisma.project.deleteMany();
  }

  async function createProjectWithPrompts(count = 3) {
    const project = await prisma.project.create({
      data: { name: 'p3', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
    const product = await prisma.product.create({
      data: { projectId: project.id, source: 'csv', title: 'Gourde Inox', brand: 'HydroPeak', category: 'sport' },
    });
    const prompts = await Promise.all(Array.from({ length: count }, (_, index) => prisma.productPrompt.create({
      data: {
        projectId: project.id,
        productId: product.id,
        text: `prompt ${index + 1}`,
        language: 'fr',
        country: 'FR',
        intent: 'best',
        source: 'template',
        status: 'proposed',
        position: index + 1,
      },
    })));
    return { project, product, prompts };
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

  it('analyzes prompts, persists prompt runs and lists them by project, prompt and product', async () => {
    const { project, product, prompts } = await createProjectWithPrompts();

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: prompts.map(prompt => prompt.id) })
      .expect(201);

    expect(res.body.results).toHaveLength(3);
    const firstResult = res.body.results[0];
    expect(firstResult.prompt).toEqual(expect.objectContaining({ id: expect.any(String), projectId: project.id, productId: product.id }));
    expect(firstResult.run).toEqual(expect.objectContaining({
      id: expect.any(String),
      projectId: project.id,
      productId: product.id,
      promptId: expect.any(String),
      provider: 'mock',
      model: 'mock-v1',
      responseText: expect.any(String),
      brandMentioned: expect.any(Boolean),
      productMentioned: expect.any(Boolean),
      competitorsMentioned: expect.any(Array),
      sentiment: expect.any(String),
      status: 'completed',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
    expect(firstResult.run.responseText.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(firstResult.run.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(firstResult.run.updatedAt))).toBe(false);

    const persistedRuns = await prisma.promptRun.findMany({ where: { projectId: project.id } });
    expect(persistedRuns).toHaveLength(3);

    const projectRuns = await request(app.getHttpServer())
      .get(`/projects/${project.id}/prompt-runs`)
      .expect(200);
    expect(projectRuns.body).toHaveLength(3);
    expect(projectRuns.body[0]).toEqual(expect.objectContaining({ provider: 'mock', model: 'mock-v1', status: 'completed' }));

    const promptRuns = await request(app.getHttpServer())
      .get(`/projects/${project.id}/prompts/${prompts[0].id}/runs`)
      .expect(200);
    expect(promptRuns.body).toHaveLength(1);
    expect(promptRuns.body[0]).toEqual(expect.objectContaining({ promptId: prompts[0].id, projectId: project.id }));

    const productRuns = await request(app.getHttpServer())
      .get(`/projects/${project.id}/products/${product.id}/prompt-runs`)
      .expect(200);
    expect(productRuns.body).toHaveLength(3);
    expect(productRuns.body.every((run: any) => run.productId === product.id)).toBe(true);
  });

  it('returns structured errors for invalid analysis requests', async () => {
    const { project } = await createProjectWithPrompts();

    const empty = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [] })
      .expect(400);
    expect(empty.body.code).toBe('PROMPT_ANALYSIS_NO_PROMPTS');

    const tooMany = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: Array.from({ length: 26 }, (_, index) => `prompt-${index}`) })
      .expect(400);
    expect(tooMany.body.code).toBe('PROMPT_ANALYSIS_LIMIT_EXCEEDED');

    const otherProject = await prisma.project.create({
      data: { name: 'other', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
    const otherProduct = await prisma.product.create({
      data: { projectId: otherProject.id, source: 'csv', title: 'Other product' },
    });
    const otherPrompt = await prisma.productPrompt.create({
      data: {
        projectId: otherProject.id,
        productId: otherProduct.id,
        text: 'other prompt',
        language: 'fr',
        country: 'FR',
        intent: 'best',
        source: 'template',
        status: 'proposed',
        position: 1,
      },
    });

    const outsideProject = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [otherPrompt.id] })
      .expect(404);
    expect(outsideProject.body.code).toBe('PROMPT_NOT_FOUND');

    const missingProject = await request(app.getHttpServer())
      .post('/projects/project-not-found/prompts/analyze')
      .send({ promptIds: [otherPrompt.id] })
      .expect(404);
    expect(missingProject.body.code).toBe('PROJECT_NOT_FOUND');
  });
});
