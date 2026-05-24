import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { ProjectsService } from './projects.service';
class CreateProjectDto { @IsString() name!: string; @IsString() primaryLanguage!: string; @IsString() targetCountry!: string; @IsString() currency!: string; }
@Controller('projects')
export class ProjectsController { constructor(private readonly service: ProjectsService) {} @Post() create(@Body() dto: CreateProjectDto){ return this.service.create(dto);} @Get() list(){return this.service.list();} @Get(':id') get(@Param('id') id: string){return this.service.getById(id);} }
