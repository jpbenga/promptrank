import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ActionCardsService } from './action-cards.service';

@Controller('projects/:projectId')
export class ActionCardsController {
  constructor(private readonly service: ActionCardsService) {}

  @Post('action-cards/generate')
  generate(@Param('projectId') projectId: string) {
    return this.service.generate(projectId);
  }

  @Get('action-cards')
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Get('products/:productId/action-cards')
  listProduct(@Param('projectId') projectId: string, @Param('productId') productId: string) {
    return this.service.listProduct(projectId, productId);
  }

  @Patch('action-cards/:actionCardId')
  update(@Param('projectId') projectId: string, @Param('actionCardId') actionCardId: string, @Body() body: any) {
    return this.service.update(projectId, actionCardId, body);
  }
}
