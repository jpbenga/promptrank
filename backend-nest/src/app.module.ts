import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaService } from './common/prisma.service';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { CsvController } from './csv/csv.controller';
import { CsvService } from './csv/csv.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { PromptsController } from './prompts/prompts.controller';
import { PromptsService } from './prompts/prompts.service';
import { AiProviderOrchestratorService } from './ai-providers/ai-provider.service';
import { MockAiProvider } from './ai-providers/mock-ai.provider';
import { OpenAiProvider } from './ai-providers/openai.provider';
import { ScoresController } from './scores/scores.controller';
import { ScoresService } from './scores/scores.service';
import { ActionCardsController } from './action-cards/action-cards.controller';
import { ActionCardsService } from './action-cards/action-cards.service';
import { ShopifyController } from './shopify/shopify.controller';
import { ShopifyService } from './shopify/shopify.service';
import { MockShopifyClient } from './shopify/mock-shopify.client';

@Module({controllers:[HealthController,ProjectsController,CsvController,ProductsController,PromptsController,ScoresController,ActionCardsController,ShopifyController],providers:[PrismaService,ProjectsService,CsvService,ProductsService,PromptsService,AiProviderOrchestratorService,MockAiProvider,OpenAiProvider,ScoresService,ActionCardsService,ShopifyService,MockShopifyClient],imports:[ConfigModule.forRoot({isGlobal:true,envFilePath:['../.env','.env']})]})
export class AppModule {}
