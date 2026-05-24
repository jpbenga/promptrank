import { Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
@Controller('projects/:id')
export class ProductsController { constructor(private readonly service: ProductsService){} @Post('csv/import') import(@Param('id') id:string){return this.service.import(id);} @Get('products') list(@Param('id') id:string){return this.service.list(id);} }
