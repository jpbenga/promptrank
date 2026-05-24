import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Phase1 flow integration', () => {
  let app: INestApplication;
  const state: any = { projects: [], imports: [], mappings: [], products: [] };
  const prismaMock: any = {
    project: { create: async ({ data }: any) => ({ id: 'p1', ...data }), findMany: async () => [{ id: 'p1' }], findUnique: async () => ({ id: 'p1' }) },
    csvImport: { create: async ({ data }: any) => ({ id: 'i1', ...data }), findUnique: async ({ where }: any) => where.id === 'i1' ? { id: 'i1', columns: ['title','price'], rows: [{ title:'A', price:'10' }] } : null },
    csvColumnMapping: { create: async ({ data }: any) => ({ id: 'm1', ...data }), findFirst: async () => ({ csvImportId: 'i1', mapping: { title:'title', price:'price' }, createdAt: new Date() }) },
    product: { create: async ({ data }: any) => data, findMany: async () => [{ title: 'A' }] }
  };
  beforeAll(async () => { const mod = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(prismaMock).compile(); app = mod.createNestApplication(); await app.init(); });
  afterAll(async () => app.close());
  it('full csv endpoints', async () => {
    await request(app.getHttpServer()).post('/projects').send({ name:'X', primaryLanguage:'fr', targetCountry:'FR', currency:'EUR' }).expect(201);
    await request(app.getHttpServer()).post('/projects/p1/csv/upload').attach('file', Buffer.from('title,price\nA,10'), 'demo.csv').expect(201);
    await request(app.getHttpServer()).post('/projects/p1/csv/mapping').send({ csvImportId: 'i1' }).expect(201);
    await request(app.getHttpServer()).post('/projects/p1/csv/import').send({}).expect(201);
    await request(app.getHttpServer()).get('/projects/p1/products').expect(200);
  });
});
