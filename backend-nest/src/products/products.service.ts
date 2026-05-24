import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NormalizedProduct } from '../../../shared-types/src';

@Injectable()
export class ProductsService { constructor(private readonly prisma: PrismaService){}
normalizeAvailability(value?:string): NormalizedProduct['availability'] {const v=(value||'').toLowerCase(); if(['in stock','instock','1','true','available','disponible'].includes(v)) return 'in_stock'; if(['out of stock','outofstock','0','false','unavailable'].includes(v)) return 'out_of_stock'; if(['preorder','pre-order'].includes(v)) return 'preorder'; return 'unknown';}
parsePrice(value?:string){ if(!value) return undefined; const normalized=value.replace(',', '.').replace(/[^0-9.]/g,''); const n=Number(normalized); return Number.isFinite(n)?n:undefined; }
toArray(value?:string){ if(!value) return undefined; return value.split(/[;,|]/).map(v=>v.trim()).filter(Boolean); }
async import(projectId:string){ try {
const mappingRec=await this.prisma.csvColumnMapping.findFirst({where:{projectId},orderBy:{createdAt:'desc'}}); if(!mappingRec) return {importedCount:0,skippedCount:0,errors:['No mapping']}; const importRec=await this.prisma.csvImport.findUnique({where:{id:mappingRec.csvImportId}}); const rows=(importRec?.rows as Record<string,string>[])||[]; const mapping=mappingRec.mapping as Record<string,string>; let importedCount=0; let skippedCount=0; const errors:string[]=[]; for(const row of rows){const titleCol=Object.keys(mapping).find(k=>mapping[k]==='title'); const title=titleCol?row[titleCol]?.trim():''; if(!title){skippedCount++; errors.push('Missing title'); continue;} const product: any={projectId,source:'csv',title,currency:'EUR',rawSource:row,attributes:{}}; for(const [col,target] of Object.entries(mapping)){const val=row[col]; if(!val) continue; if(target==='price') product.price=this.parsePrice(val); else if(target==='availability') product.availability=this.normalizeAvailability(val); else if(target==='imageUrls') product.imageUrls=this.toArray(val); else if(target==='tags') product.tags=this.toArray(val); else product[target]=val;} for (const [col,val] of Object.entries(row)){ if(!mapping[col] && val) product.attributes[col]=String(val); }
await this.prisma.product.create({data:product}); importedCount++; } return {importedCount,skippedCount,errors};
} catch { throw new BadRequestException({code:'PRODUCT_IMPORT_FAILED',message:'Product import failed'}); }}
list(projectId:string){ return this.prisma.product.findMany({where:{projectId},orderBy:{createdAt:'desc'}}); }
}
