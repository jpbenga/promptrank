import { BadRequestException, Body, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvService } from './csv.service';

@Controller('projects/:id/csv')
export class CsvController {
  constructor(private readonly service: CsvService) {}
  @Post('upload') @UseInterceptors(FileInterceptor('file'))
  async upload(@Param('id') projectId:string,@UploadedFile() file: Express.Multer.File){ if(!file) throw new BadRequestException({code:'CSV_PARSE_ERROR',message:'Missing file'}); return this.service.saveUpload(projectId,file.originalname,file.buffer.toString('utf-8')); }
  @Post('mapping') async mapping(@Param('id') projectId:string,@Body() body:{csvImportId:string; mapping?:Record<string,string>}){ const imp=await this.service['prisma'].csvImport.findUnique({where:{id:body.csvImportId}}); if(!imp) throw new BadRequestException({code:'CSV_PARSE_ERROR',message:'Import not found'}); const mapping=body.mapping ?? this.service.proposeMapping((imp.columns as string[])); const saved=await this.service.saveMapping(projectId,body.csvImportId,mapping); return {mapping,saved}; }
}
