import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Phase 3 prompt runs', () => {
  let app: INestApplication; let prisma: PrismaService;
  beforeAll(async()=>{process.env.DATABASE_URL=process.env.TEST_DATABASE_URL; const mod=await Test.createTestingModule({imports:[AppModule]}).compile(); app=mod.createNestApplication(); await app.init(); prisma=app.get(PrismaService);});
  beforeEach(async()=>{await prisma.promptRun.deleteMany(); await prisma.productPrompt.deleteMany(); await prisma.product.deleteMany(); await prisma.project.deleteMany();});
  afterAll(async()=>{await app.close();});
  it('analyzes 3 prompts and lists runs', async()=>{
    const project = await prisma.project.create({data:{name:'p3',source:'csv',primaryLanguage:'fr',targetCountry:'FR',currency:'EUR'}});
    const product = await prisma.product.create({data:{projectId:project.id,source:'csv',title:'Gourde Inox',brand:'HydroPeak',category:'sport'}});
    const prompts = await Promise.all([1,2,3].map(i=>prisma.productPrompt.create({data:{projectId:project.id,productId:product.id,text:`prompt ${i}`,language:'fr',country:'FR',intent:'best',source:'template',status:'proposed',position:i}})));
    const res = await request(app.getHttpServer()).post(`/projects/${project.id}/prompts/analyze`).send({promptIds:prompts.map(p=>p.id)}).expect(201);
    expect(res.body.results).toHaveLength(3);
    const list = await request(app.getHttpServer()).get(`/projects/${project.id}/prompt-runs`).expect(200); expect(list.body).toHaveLength(3);
  });
});
