import { Controller, Get, Param, Post } from '@nestjs/common';
import { ScoresService } from './scores.service';

@Controller('projects/:projectId')
export class ScoresController {
  constructor(private readonly service: ScoresService) {}

  @Post('scores/compute')
  compute(@Param('projectId') projectId: string) {
    return this.service.compute(projectId);
  }

  @Get('scores')
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Get('scores/project')
  getProjectScore(@Param('projectId') projectId: string) {
    return this.service.getProjectScore(projectId);
  }

  @Get('products/:productId/score')
  getProductScore(@Param('projectId') projectId: string, @Param('productId') productId: string) {
    return this.service.getProductScore(projectId, productId);
  }
}
