import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Controller('projects/:projectId')
export class PromptsController {
  constructor(private readonly service: PromptsService) {}
  @Post('prompts/generate') generate(@Param('projectId') projectId: string, @Body() body: any) { return this.service.generate(projectId, body); }
  @Get('prompts') listProject(@Param('projectId') projectId: string) { return this.service.listProject(projectId); }
  @Get('products/:productId/prompts') listProduct(@Param('projectId') projectId: string, @Param('productId') productId: string) { return this.service.listProduct(projectId, productId); }
  @Post('prompts/analyze') analyze(@Param('projectId') projectId: string, @Body() body: any) { return this.service.analyze(projectId, body); }
  @Get('prompt-runs') listRuns(@Param('projectId') projectId: string) { return this.service.listRunsByProject(projectId); }
  @Get('prompts/:promptId/runs') listPromptRuns(@Param('projectId') projectId: string, @Param('promptId') promptId: string) { return this.service.listRunsByPrompt(projectId, promptId); }
  @Get('products/:productId/prompt-runs') listProductRuns(@Param('projectId') projectId: string, @Param('productId') productId: string) { return this.service.listRunsByProduct(projectId, productId); }
  @Patch('prompts/:promptId') update(@Param('projectId') projectId: string, @Param('promptId') promptId: string, @Body() body: any) { return this.service.update(projectId, promptId, body); }
  @Delete('prompts/:promptId') remove(@Param('projectId') projectId: string, @Param('promptId') promptId: string) { return this.service.remove(projectId, promptId); }
}
