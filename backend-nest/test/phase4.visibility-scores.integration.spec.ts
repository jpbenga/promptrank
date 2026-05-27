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

describe('Phase 4 visibility scores', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanDatabase() {
    await prisma.visibilityScore.deleteMany();
    await prisma.promptRun.deleteMany();
    await prisma.productPrompt.deleteMany();
    await prisma.product.deleteMany();
    await prisma.project.deleteMany();
  }

  async function createAnalyzedProject() {
    const project = await prisma.project.create({
      data: { name: 'p4', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
    const product = await prisma.product.create({
      data: { projectId: project.id, source: 'csv', title: 'Gourde Inox', brand: 'HydroPeak', category: 'sport' },
    });
    const prompts = await Promise.all([1, 2].map(index => prisma.productPrompt.create({
      data: {
        projectId: project.id,
        productId: product.id,
        text: `prompt score ${index}`,
        language: 'fr',
        country: 'FR',
        intent: 'best',
        source: 'template',
        status: 'proposed',
        position: index,
      },
    })));
    await prisma.promptRun.create({
      data: {
        projectId: project.id,
        productId: product.id,
        promptId: prompts[0].id,
        provider: 'mock',
        model: 'mock-v1',
        responseText: 'HydroPeak Gourde Inox est recommandée devant Stanley.',
        brandMentioned: true,
        productMentioned: true,
        competitorsMentioned: ['Stanley'],
        position: 1,
        sentiment: 'positive',
        status: 'completed',
      },
    });
    await prisma.promptRun.create({
      data: {
        projectId: project.id,
        productId: product.id,
        promptId: prompts[1].id,
        provider: 'mock',
        model: 'mock-v1',
        responseText: 'Gourde Inox est correcte, Nike et Stanley sont aussi cités.',
        brandMentioned: false,
        productMentioned: true,
        competitorsMentioned: ['Nike', 'Stanley'],
        position: 2,
        sentiment: 'neutral',
        status: 'completed',
      },
    });
    return { project, product };
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

  it('computes, persists and lists project and product visibility scores', async () => {
    const { project, product } = await createAnalyzedProject();

    const compute = await request(app.getHttpServer())
      .post(`/projects/${project.id}/scores/compute`)
      .send({})
      .expect(201);

    expect(compute.body.projectScore).toEqual(expect.objectContaining({
      id: expect.any(String),
      projectId: project.id,
      productId: null,
      scope: 'project',
      score: expect.any(Number),
      analyzedPromptsCount: 2,
      brandMentionRate: 0.5,
      productMentionRate: 1,
      competitorMentionRate: 1,
      averagePosition: 1.5,
      dominantSentiment: expect.any(String),
      topCompetitors: ['Stanley', 'Nike'],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
    expect(Number.isNaN(Date.parse(compute.body.projectScore.createdAt))).toBe(false);
    expect(compute.body.productScores).toHaveLength(1);
    expect(compute.body.productScores[0]).toEqual(expect.objectContaining({
      projectId: project.id,
      productId: product.id,
      scope: 'product',
      analyzedPromptsCount: 2,
      brandMentionRate: 0.5,
      productMentionRate: 1,
      competitorMentionRate: 1,
      topCompetitors: ['Stanley', 'Nike'],
    }));

    const persistedScores = await prisma.visibilityScore.findMany({ where: { projectId: project.id } });
    expect(persistedScores).toHaveLength(2);

    const allScores = await request(app.getHttpServer())
      .get(`/projects/${project.id}/scores`)
      .expect(200);
    expect(allScores.body).toHaveLength(2);

    const projectScore = await request(app.getHttpServer())
      .get(`/projects/${project.id}/scores/project`)
      .expect(200);
    expect(projectScore.body).toEqual(expect.objectContaining({ scope: 'project', projectId: project.id }));

    const productScore = await request(app.getHttpServer())
      .get(`/projects/${project.id}/products/${product.id}/score`)
      .expect(200);
    expect(productScore.body).toEqual(expect.objectContaining({ scope: 'product', productId: product.id }));
  });

  it('returns SCORE_NO_PROMPT_RUNS when no completed run exists', async () => {
    const project = await prisma.project.create({
      data: { name: 'empty p4', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/scores/compute`)
      .send({})
      .expect(400);

    expect(res.body.code).toBe('SCORE_NO_PROMPT_RUNS');
  });

  it('returns PROJECT_NOT_FOUND when the project does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/projects/project-not-found/scores/compute')
      .send({})
      .expect(404);

    expect(res.body.code).toBe('PROJECT_NOT_FOUND');
  });
});
