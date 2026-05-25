import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../common/prisma.service';

const autoMap: Record<string, string> = {
  nom: 'title',
  name: 'title',
  product_name: 'title',
  titre: 'title',
  title: 'title',
  nom_produit: 'title',
  description: 'description',
  description_longue: 'description',
  body: 'description',
  body_html: 'description',
  price: 'price',
  prix: 'price',
  prix_ttc: 'price',
  sku: 'sku',
  reference: 'sku',
  brand: 'brand',
  marque: 'brand',
  vendor: 'vendor',
  fournisseur: 'vendor',
  category: 'category',
  categorie: 'category',
  product_type: 'productType',
  type: 'productType',
  url: 'url',
  url_fiche: 'url',
  link: 'url',
  image: 'imageUrls',
  image_url: 'imageUrls',
  imageurls: 'imageUrls',
  ean: 'gtin',
  ean13: 'gtin',
  gtin: 'gtin',
  barcode: 'gtin',
  stock: 'availability',
  availability: 'availability',
  disponibilite: 'availability',
  tags: 'tags',
  tag: 'tags',
  mots_cles: 'tags',
  seo_title: 'seoTitle',
  titre_seo: 'seoTitle',
  meta_description: 'metaDescription',
  description_seo: 'metaDescription',
  currency: 'currency',
};

function normalizeColumnKey(column: string) {
  return column
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

@Injectable()
export class CsvService {
  constructor(private readonly prisma: PrismaService) {}
  detectDelimiter(content: string){const c=[',',';','\t']; return c.sort((a,b)=>((content.match(new RegExp(`\\${b}`,'g'))||[]).length)-((content.match(new RegExp(`\\${a}`,'g'))||[]).length))[0];}
  parseCsv(content: string, delimiter: string){ return parse(content,{columns:true,skip_empty_lines:true,delimiter}); }
  async saveUpload(projectId:string,fileName:string,content:string){ const project=await this.prisma.project.findUnique({where:{id:projectId}}); if(!project) throw new NotFoundException({code:'PROJECT_NOT_FOUND',message:'Project not found'}); if(!fileName.toLowerCase().endsWith('.csv')) throw new BadRequestException({code:'CSV_INVALID_FILE_TYPE',message:'Only CSV files are accepted'}); const delimiter=this.detectDelimiter(content); const rows=this.parseCsv(content, delimiter); if(rows.length===0) throw new BadRequestException({code:'CSV_EMPTY_FILE',message:'CSV file is empty'}); const columns=Object.keys(rows[0]||{}); if(columns.length===0) throw new BadRequestException({code:'CSV_NO_COLUMNS_FOUND',message:'No columns found'}); return this.prisma.csvImport.create({data:{projectId,originalFileName:fileName,detectedDelimiter:delimiter,columns,previewRows:rows.slice(0,20),rows,rowCount:rows.length,status:'uploaded'}}); }
  proposeMapping(columns:string[]){const mapping: Record<string,string>={}; for(const c of columns){const key=normalizeColumnKey(c); if(autoMap[key]) mapping[c]=autoMap[key];} return mapping;}
  async saveMapping(projectId:string,csvImportId:string,mapping:Record<string,string>){ if(!Object.values(mapping).includes('title')) throw new BadRequestException({code:'CSV_MAPPING_MISSING_TITLE',message:'Title field is required'}); return this.prisma.csvColumnMapping.create({data:{projectId,csvImportId,mapping}}); }
}
