import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
@Injectable()
export class ProjectsService { constructor(private readonly prisma: PrismaService){} create(dto:{name:string;primaryLanguage:string;targetCountry:string;currency:string;}){return this.prisma.project.create({data:{...dto,source:'csv'}});} list(){return this.prisma.project.findMany({orderBy:{createdAt:'desc'}});} async getById(id:string){const p=await this.prisma.project.findUnique({where:{id}}); if(!p) throw new NotFoundException({code:'PROJECT_NOT_FOUND',message:'Project not found'}); return p;} }
