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

describe('Phase 5 action cards', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  async function cleanDatabase() {
    await prisma.actionCard.deleteMany();
    await prisma.visibilityScore.deleteMany();
    await prisma.promptRun.deleteMany();
    await prisma.productPrompt.deleteMany();
    await prisma.product.deleteMany();
    await prisma.project.deleteMany();
  }

  async function createProjectWithScores() {
    const project = await prisma.project.create({
      data: { name: 'p5', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
    const product = await prisma.product.create({
      data: { projectId: project.id, source: 'csv', title: 'Gourde Inox', brand: 'HydroPeak', category: 'sport' },
    });
    const productScore = await prisma.visibilityScore.create({
      data: {
        projectId: project.id,
        productId: product.id,
        scope: 'product',
        score: 32,
        analyzedPromptsCount: 3,
        brandMentionRate: 0.3,
        productMentionRate: 0.2,
        competitorMentionRate: 0.8,
        averagePosition: 3,
        dominantSentiment: 'negative',
        topCompetitors: ['Stanley', 'Nike'],
        details: {},
      },
    });
    const projectScore = await prisma.visibilityScore.create({
      data: {
        projectId: project.id,
        productId: null,
        scope: 'project',
        score: 45,
        analyzedPromptsCount: 3,
        brandMentionRate: 0.4,
        productMentionRate: 0.4,
        competitorMentionRate: 0.7,
        averagePosition: 2.5,
        dominantSentiment: 'neutral',
        topCompetitors: ['Stanley'],
        details: {},
      },
    });
    return { project, product, productScore, projectScore };
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

  it('generates, lists and updates deterministic action cards', async () => {
    const { project, product } = await createProjectWithScores();

    const generated = await request(app.getHttpServer())
      .post(`/projects/${project.id}/action-cards/generate`)
      .send({})
      .expect(201);

    expect(generated.body.generatedCount).toBeGreaterThan(0);
    expect(generated.body.cards[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      projectId: project.id,
      title: expect.any(String),
      description: expect.any(String),
      category: expect.any(String),
      priority: expect.any(String),
      status: 'open',
      reason: expect.any(String),
      recommendation: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
    expect(generated.body.cards.some((card: any) => card.productId === product.id)).toBe(true);

    const persistedCards = await prisma.actionCard.findMany({ where: { projectId: project.id } });
    expect(persistedCards.length).toBe(generated.body.generatedCount);

    const allCards = await request(app.getHttpServer())
      .get(`/projects/${project.id}/action-cards`)
      .expect(200);
    expect(allCards.body.length).toBe(generated.body.generatedCount);

    const productCards = await request(app.getHttpServer())
      .get(`/projects/${project.id}/products/${product.id}/action-cards`)
      .expect(200);
    expect(productCards.body.length).toBeGreaterThan(0);
    expect(productCards.body.every((card: any) => card.productId === product.id)).toBe(true);

    const done = await request(app.getHttpServer())
      .patch(`/projects/${project.id}/action-cards/${generated.body.cards[0].id}`)
      .send({ status: 'done' })
      .expect(200);
    expect(done.body.status).toBe('done');

    const dismissed = await request(app.getHttpServer())
      .patch(`/projects/${project.id}/action-cards/${generated.body.cards[0].id}`)
      .send({ status: 'dismissed' })
      .expect(200);
    expect(dismissed.body.status).toBe('dismissed');
  });

  it('returns ACTION_CARDS_NO_SCORES when no visibility score exists', async () => {
    const project = await prisma.project.create({
      data: { name: 'empty p5', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/action-cards/generate`)
      .send({})
      .expect(400);

    expect(res.body.code).toBe('ACTION_CARDS_NO_SCORES');
  });

  it('returns structured errors for missing project, missing card and invalid update', async () => {
    const missingProject = await request(app.getHttpServer())
      .post('/projects/project-not-found/action-cards/generate')
      .send({})
      .expect(404);
    expect(missingProject.body.code).toBe('PROJECT_NOT_FOUND');

    const { project } = await createProjectWithScores();
    const missingCard = await request(app.getHttpServer())
      .patch(`/projects/${project.id}/action-cards/card-not-found`)
      .send({ status: 'done' })
      .expect(404);
    expect(missingCard.body.code).toBe('ACTION_CARD_NOT_FOUND');

    const generated = await request(app.getHttpServer())
      .post(`/projects/${project.id}/action-cards/generate`)
      .send({})
      .expect(201);
    const invalid = await request(app.getHttpServer())
      .patch(`/projects/${project.id}/action-cards/${generated.body.cards[0].id}`)
      .send({ status: 'invalid' })
      .expect(400);
    expect(invalid.body.code).toBe('ACTION_CARD_UPDATE_INVALID');
  });
});
