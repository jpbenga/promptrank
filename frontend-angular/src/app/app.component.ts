import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router, provideRouter, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ApiError = { code?: string; message?: string };
const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
class ErrorI18nService {
  private readonly map: Record<string, string> = {
    CSV_INVALID_FILE_TYPE: 'errors.CSV_INVALID_FILE_TYPE', CSV_FILE_TOO_LARGE: 'errors.CSV_FILE_TOO_LARGE', CSV_PARSE_ERROR: 'errors.CSV_PARSE_ERROR', CSV_EMPTY_FILE: 'errors.CSV_EMPTY_FILE', CSV_NO_COLUMNS_FOUND: 'errors.CSV_NO_COLUMNS_FOUND', CSV_MAPPING_MISSING_TITLE: 'errors.CSV_MAPPING_MISSING_TITLE', PROJECT_NOT_FOUND: 'errors.PROJECT_NOT_FOUND', PRODUCT_IMPORT_FAILED: 'errors.PRODUCT_IMPORT_FAILED'
  };
  getKey(code?: string) { return this.map[code || ''] || 'errors.UNKNOWN'; }
}

@Injectable({ providedIn: 'root' })
class ApiService { private http = inject(HttpClient);
  createProject(payload: any) { return this.http.post<any>(`${API_URL}/projects`, payload); }
  uploadCsv(projectId: string, file: File) { const form = new FormData(); form.append('file', file); return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/upload`, form); }
  saveMapping(projectId: string, csvImportId: string, mapping?: Record<string,string>) { return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/mapping`, { csvImportId, mapping }); }
  importProducts(projectId: string){ return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/import`, {}); }
  listProducts(projectId: string){ return this.http.get<any[]>(`${API_URL}/projects/${projectId}/products`); }
}

@Component({selector:'app-home',standalone:true,imports:[TranslateModule,RouterLink],template:`<section><p>{{'home.description'|translate}}</p><a routerLink='/projects/new'>{{'home.ctaCreateProject'|translate}}</a></section>`})
class HomeComponent {}
@Component({selector:'app-new-project',standalone:true,imports:[CommonModule,FormsModule,TranslateModule],template:`<h2>{{'projectCreate.title'|translate}}</h2><form (ngSubmit)='submit()'><input [(ngModel)]='form.name' name='name' [placeholder]="'projectCreate.name'|translate" required/><input [(ngModel)]='form.primaryLanguage' name='primaryLanguage' required/><input [(ngModel)]='form.targetCountry' name='targetCountry' required/><input [(ngModel)]='form.currency' name='currency' required/><button [disabled]='loading'>{{'common.create'|translate}}</button></form><p *ngIf='loading'>{{'states.loading'|translate}}</p><p *ngIf='error'>{{error|translate}}</p>`})
class NewProjectComponent{api=inject(ApiService);router=inject(Router);errs=inject(ErrorI18nService);loading=false;error='';form={name:'Demo CSV',primaryLanguage:'fr',targetCountry:'FR',currency:'EUR'};submit(){this.loading=true;this.error='';this.api.createProject(this.form).subscribe({next:r=>this.router.navigate(['/projects',r.id,'upload']),error:(e:HttpErrorResponse)=>{this.error=this.errs.getKey((e.error as ApiError)?.code);this.loading=false;}});}}
@Component({standalone:true,imports:[CommonModule,TranslateModule],template:`<h2>{{'csvUpload.title'|translate}}</h2><input type='file' accept='.csv,text/csv' (change)='pick($event)'/><button (click)='upload()' [disabled]='!file||loading'>{{'csvUpload.submit'|translate}}</button><p *ngIf='loading'>{{'states.loading'|translate}}</p><p *ngIf='error'>{{error|translate}}</p>`})
class UploadComponent{route=inject(ActivatedRoute);router=inject(Router);api=inject(ApiService);errs=inject(ErrorI18nService);file?:File;loading=false;error='';pick(e:Event){const target=e.target as HTMLInputElement;const f=target.files?.[0]; if(!f)return; if(!f.name.toLowerCase().endsWith('.csv')){this.error='errors.CSV_INVALID_FILE_TYPE';return;} this.file=f; this.error='';} upload(){if(!this.file)return; this.loading=true; const id=this.route.snapshot.paramMap.get('id')!; this.api.uploadCsv(id,this.file).subscribe({next:r=>this.router.navigate(['/projects',id,'preview'],{state:{preview:r}}),error:(e:HttpErrorResponse)=>{this.error=this.errs.getKey((e.error as ApiError)?.code);this.loading=false;}});} }
@Component({standalone:true,imports:[CommonModule,TranslateModule,RouterLink],template:`<h2>{{'csvPreview.title'|translate}}</h2><div *ngIf='!preview'>{{'states.empty'|translate}}</div><div *ngIf='preview'><p>{{'csvPreview.delimiter'|translate}}: {{preview.detectedDelimiter}}</p><p>{{'csvPreview.columns'|translate}}: {{preview.columns.join(', ')}}</p><table><tr *ngFor='let row of preview.previewRows | slice:0:20'><td *ngFor='let c of preview.columns'>{{row[c]}}</td></tr></table><a [routerLink]="['/projects',projectId,'mapping']" [state]="{preview}">{{'csvPreview.continue'|translate}}</a></div>`})
class PreviewComponent{router=inject(Router);route=inject(ActivatedRoute);preview:any=history.state.preview;projectId=this.route.snapshot.paramMap.get('id');}
@Component({standalone:true,imports:[CommonModule,FormsModule,TranslateModule,RouterLink],template:`<h2>{{'csvMapping.title'|translate}}</h2><div *ngIf='error'>{{error|translate}}</div><div *ngIf='loading'>{{'states.loading'|translate}}</div><div *ngIf='preview'><div *ngFor='let c of preview.columns'><label>{{c}}</label><select [(ngModel)]='mapping[c]' [name]='c'><option value=''>-</option><option *ngFor='let f of fields' [value]='f'>{{f}}</option></select></div><button (click)='save()'>{{'csvMapping.save'|translate}}</button><button (click)='importProducts()'>{{'csvMapping.import'|translate}}</button></div>`})
class MappingComponent{api=inject(ApiService);route=inject(ActivatedRoute);router=inject(Router);errs=inject(ErrorI18nService);preview:any=history.state.preview;mapping:Record<string,string>={};loading=false;error='';fields=['title','sku','brand','category','price','currency','availability','url','description','vendor','productType','imageUrls','tags'];ngOnInit(){if(!this.preview){this.error='states.empty';return;}this.loading=true;this.api.saveMapping(this.projectId(),this.preview.id).subscribe({next:r=>{this.mapping=r.mapping||{};this.loading=false;},error:(e:HttpErrorResponse)=>{this.error=this.errs.getKey((e.error as ApiError)?.code);this.loading=false;}});}projectId(){return this.route.snapshot.paramMap.get('id')!;}save(){if(!Object.values(this.mapping).includes('title')){this.error='errors.CSV_MAPPING_MISSING_TITLE';return;}this.api.saveMapping(this.projectId(),this.preview.id,this.mapping).subscribe({next:()=>this.error='',error:(e:HttpErrorResponse)=>this.error=this.errs.getKey((e.error as ApiError)?.code)});}importProducts(){this.api.importProducts(this.projectId()).subscribe({next:()=>this.router.navigate(['/projects',this.projectId(),'products']),error:(e:HttpErrorResponse)=>this.error=this.errs.getKey((e.error as ApiError)?.code)});} }
@Component({standalone:true,imports:[CommonModule,TranslateModule],template:`<h2>{{'products.title'|translate}}</h2><p *ngIf='loading'>{{'states.loading'|translate}}</p><p *ngIf='error'>{{error|translate}}</p><p *ngIf='!loading && !error && products.length===0'>{{'states.empty'|translate}}</p><table *ngIf='products.length'><tr><th *ngFor='let c of cols'>{{('products.columns.'+c)|translate}}</th></tr><tr *ngFor='let p of products'><td>{{p.title}}</td><td>{{p.sku}}</td><td>{{p.brand}}</td><td>{{p.category}}</td><td>{{p.price}}</td><td>{{p.currency}}</td><td>{{p.availability}}</td><td>{{p.url}}</td></tr></table>`})
class ProductsComponent{api=inject(ApiService);route=inject(ActivatedRoute);errs=inject(ErrorI18nService);products:any[]=[];loading=true;error='';cols=['title','sku','brand','category','price','currency','availability','url'];ngOnInit(){this.api.listProducts(this.route.snapshot.paramMap.get('id')!).subscribe({next:r=>{this.products=r;this.loading=false;},error:(e:HttpErrorResponse)=>{this.error=this.errs.getKey((e.error as ApiError)?.code);this.loading=false;}});}}

const routes: Routes=[{path:'',component:HomeComponent},{path:'projects/new',component:NewProjectComponent},{path:'projects/:id/upload',component:UploadComponent},{path:'projects/:id/preview',component:PreviewComponent},{path:'projects/:id/mapping',component:MappingComponent},{path:'projects/:id/products',component:ProductsComponent}];
export const APP_ROUTES=routes;

@Component({selector:'app-root',standalone:true,imports:[TranslateModule,RouterLink,RouterLinkActive,RouterOutlet],template:`<main class='p-6'><header><h1>{{'app.title'|translate}}</h1><nav><a routerLink='/'>{{'nav.home'|translate}}</a> | <a routerLink='/projects/new'>{{'nav.newProject'|translate}}</a></nav><button (click)='setLang("fr")'>FR</button><button (click)='setLang("en")'>EN</button></header><router-outlet /></main>`})
export class AppComponent { private t=inject(TranslateService); constructor(){const l=localStorage.getItem('lang')||'fr'; this.t.use(l);} setLang(l:string){this.t.use(l); localStorage.setItem('lang',l);} }

export const APP_PROVIDERS=[provideRouter(routes)];
