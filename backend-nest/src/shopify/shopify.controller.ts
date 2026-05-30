import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ConfigureShopifyRequest } from '@promptrank/shared-types';
import { ShopifyService } from './shopify.service';

@Controller('projects/:projectId/shopify')
export class ShopifyController {
  constructor(private readonly service: ShopifyService) {}

  @Post('config')
  configure(@Param('projectId') projectId: string, @Body() body: ConfigureShopifyRequest) {
    return this.service.configure(projectId, body);
  }

  @Get('status')
  status(@Param('projectId') projectId: string) {
    return this.service.status(projectId);
  }

  @Post('sync')
  sync(@Param('projectId') projectId: string) {
    return this.service.sync(projectId);
  }
}
