import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Controller('projects/:projectId')
export class PromptsController {
  constructor(private readonly service: PromptsService) {}
  @Post('prompts/generate') generate(@Param('projectId') projectId: string, @Body() body: any) { return this.service.generate(projectId, body); }
  @Get('prompts') listProject(@Param('projectId') projectId: string) { return this.service.listProject(projectId); }
  @Get('products/:productId/prompts') listProduct(@Param('projectId') projectId: string, @Param('productId') productId: string) { return this.service.listProduct(projectId, productId); }
  @Patch('prompts/:promptId') update(@Param('projectId') projectId: string, @Param('promptId') promptId: string, @Body() body: any) { return this.service.update(projectId, promptId, body); }
  @Delete('prompts/:promptId') remove(@Param('projectId') projectId: string, @Param('promptId') promptId: string) { return this.service.remove(projectId, promptId); }
}
