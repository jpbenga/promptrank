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

describe('Phase 6 AI provider abstraction', () => {
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

  async function createProjectWithPrompt() {
    const project = await prisma.project.create({
      data: { name: 'p6', source: 'csv', primaryLanguage: 'fr', targetCountry: 'FR', currency: 'EUR' },
    });
    const product = await prisma.product.create({
      data: { projectId: project.id, source: 'csv', title: 'Gourde Inox', brand: 'HydroPeak', category: 'sport' },
    });
    const prompt = await prisma.productPrompt.create({
      data: {
        projectId: project.id,
        productId: product.id,
        text: 'meilleure gourde sport',
        language: 'fr',
        country: 'FR',
        intent: 'best',
        source: 'template',
        status: 'proposed',
        position: 1,
      },
    });
    return { project, product, prompt };
  }

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for integration tests.');
    }
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.AI_PROVIDER_DEFAULT = 'mock';
    process.env.AI_REAL_PROVIDERS_ENABLED = 'false';
    process.env.OPENAI_API_KEY = '';

    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase();
  });

  beforeEach(async () => {
    process.env.AI_PROVIDER_DEFAULT = 'mock';
    process.env.AI_REAL_PROVIDERS_ENABLED = 'false';
    process.env.OPENAI_API_KEY = '';
    await cleanDatabase();
  });

  afterAll(async () => {
    if (prisma) await cleanDatabase();
    if (app) await app.close();
  });

  it('keeps POST analyze working with the default mock provider', async () => {
    const { project, prompt } = await createProjectWithPrompt();

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [prompt.id] })
      .expect(201);

    expect(res.body.results[0].run).toEqual(expect.objectContaining({ provider: 'mock', model: 'mock-v1' }));
  });

  it('supports explicit provider=mock and persists provider/model', async () => {
    const { project, prompt } = await createProjectWithPrompt();

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [prompt.id], provider: 'mock' })
      .expect(201);

    expect(res.body.results[0].run.provider).toBe('mock');
    expect(res.body.results[0].run.model).toBe('mock-v1');

    const persisted = await prisma.promptRun.findFirst({ where: { promptId: prompt.id } });
    expect(persisted).toEqual(expect.objectContaining({ provider: 'mock', model: 'mock-v1' }));
  });

  it('returns AI_PROVIDER_DISABLED for openai when real providers are disabled', async () => {
    const { project, prompt } = await createProjectWithPrompt();

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [prompt.id], provider: 'openai' })
      .expect(400);

    expect(res.body.code).toBe('AI_PROVIDER_DISABLED');
  });

  it('returns AI_PROVIDER_NOT_CONFIGURED when openai is enabled without an API key', async () => {
    const { project, prompt } = await createProjectWithPrompt();
    process.env.AI_REAL_PROVIDERS_ENABLED = 'true';
    process.env.OPENAI_API_KEY = '';

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [prompt.id], provider: 'openai' })
      .expect(400);

    expect(res.body.code).toBe('AI_PROVIDER_NOT_CONFIGURED');
  });

  it('returns AI_PROVIDER_UNSUPPORTED for unknown providers', async () => {
    const { project, prompt } = await createProjectWithPrompt();

    const res = await request(app.getHttpServer())
      .post(`/projects/${project.id}/prompts/analyze`)
      .send({ promptIds: [prompt.id], provider: 'perplexity' })
      .expect(400);

    expect(res.body.code).toBe('AI_PROVIDER_UNSUPPORTED');
  });
});
