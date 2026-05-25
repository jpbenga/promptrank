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

@Module({controllers:[HealthController,ProjectsController,CsvController,ProductsController],providers:[PrismaService,ProjectsService,CsvService,ProductsService],imports:[ConfigModule.forRoot({isGlobal:true,envFilePath:['../.env','.env']})]})
export class AppModule {}
