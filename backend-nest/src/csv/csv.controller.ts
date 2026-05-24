import { BadRequestException, Body, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvService } from './csv.service';

@Controller('projects/:id/csv')
export class CsvController {
  constructor(private readonly service: CsvService) {}
  @Post('upload') @UseInterceptors(FileInterceptor('file'))
  async upload(@Param('id') projectId:string,@UploadedFile() file: Express.Multer.File){
    const maxMb = Number(process.env.CSV_MAX_FILE_SIZE_MB ?? 5);
    if(!file) throw new BadRequestException({code:'CSV_PARSE_ERROR',message:'Missing file'});
    if(file.size > maxMb * 1024 * 1024) throw new BadRequestException({code:'CSV_FILE_TOO_LARGE',message:'File too large'});
    return this.service.saveUpload(projectId,file.originalname,file.buffer.toString('utf-8'));
  }
  @Post('mapping') async mapping(@Param('id') projectId:string,@Body() body:{csvImportId:string; mapping?:Record<string,string>}){ const imp=await this.service['prisma'].csvImport.findUnique({where:{id:body.csvImportId}}); if(!imp) throw new BadRequestException({code:'CSV_PARSE_ERROR',message:'Import not found'}); const mapping=body.mapping ?? this.service.proposeMapping((imp.columns as string[])); const saved=await this.service.saveMapping(projectId,body.csvImportId,mapping); return {mapping,saved}; }
}
