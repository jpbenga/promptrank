import { Component, Injectable, Input, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router, provideRouter, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import type { GeneratePromptsRequest, ProductPrompt, UpdatePromptRequest } from '@promptrank/shared-types';
type ApiError = { code?: string; message?: string };
const API_URL = 'http://localhost:3000';
const CSV_MAX_FILE_SIZE_MB = 5;

@Injectable({ providedIn: 'root' })
export class ErrorI18nService {
  private readonly map: Record<string, string> = {
    CSV_INVALID_FILE_TYPE: 'errors.CSV_INVALID_FILE_TYPE',
    CSV_FILE_REQUIRED: 'errors.CSV_FILE_REQUIRED',
    CSV_FILE_TOO_LARGE: 'errors.CSV_FILE_TOO_LARGE',
    CSV_PARSE_ERROR: 'errors.CSV_PARSE_ERROR',
    CSV_EMPTY_FILE: 'errors.CSV_EMPTY_FILE',
    CSV_NO_COLUMNS_FOUND: 'errors.CSV_NO_COLUMNS_FOUND',
    CSV_MAPPING_MISSING_TITLE: 'errors.CSV_MAPPING_MISSING_TITLE',
    PROJECT_NOT_FOUND: 'errors.PROJECT_NOT_FOUND',
    PRODUCT_IMPORT_FAILED: 'errors.PRODUCT_IMPORT_FAILED',
    PROMPT_GENERATION_LIMIT_EXCEEDED: 'errors.PROMPT_GENERATION_LIMIT_EXCEEDED',
    PROMPT_GENERATION_NO_PRODUCTS: 'errors.PROMPT_GENERATION_NO_PRODUCTS',
    PROMPT_NOT_FOUND: 'errors.PROMPT_NOT_FOUND',
    PROMPT_UPDATE_INVALID: 'errors.PROMPT_UPDATE_INVALID',
  };

  getKey(code?: string) { return this.map[code || ''] || 'errors.UNKNOWN'; }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  createProject(payload: any) { return this.http.post<any>(`${API_URL}/projects`, payload); }
  uploadCsv(projectId: string, file: File) { const form = new FormData(); form.append('file', file); return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/upload`, form); }
  saveMapping(projectId: string, csvImportId: string, mapping?: Record<string, string>) { return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/mapping`, { csvImportId, mapping }); }
  importProducts(projectId: string) { return this.http.post<any>(`${API_URL}/projects/${projectId}/csv/import`, {}); }
  listProducts(projectId: string) { return this.http.get<any[]>(`${API_URL}/projects/${projectId}/products`); }
  generatePrompts(projectId: string, payload: GeneratePromptsRequest) { return this.http.post<any>(`${API_URL}/projects/${projectId}/prompts/generate`, payload); }
  listPrompts(projectId: string) { return this.http.get<ProductPrompt[]>(`${API_URL}/projects/${projectId}/prompts`); }
  updatePrompt(projectId: string, promptId: string, payload: UpdatePromptRequest) { return this.http.patch<ProductPrompt>(`${API_URL}/projects/${projectId}/prompts/${promptId}`, payload); }
  deletePrompt(projectId: string, promptId: string) { return this.http.delete<any>(`${API_URL}/projects/${projectId}/prompts/${promptId}`); }
}

@Component({
  selector: 'app-csv-flow-stepper',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <nav class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" [attr.aria-label]="'flowStepper.ariaLabel' | translate">
      <ol class="grid gap-3 sm:grid-cols-5">
        <li *ngFor="let step of steps; let i = index" class="flex items-center gap-3 rounded-xl border px-3 py-3" [ngClass]="stepClass(i)">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" [ngClass]="markerClass(i)">
            {{ i + 1 }}
          </span>
          <span>
            <span class="block text-sm font-semibold">{{ step.labelKey | translate }}</span>
            <span class="block text-xs" [ngClass]="i === currentIndex() ? 'text-blue-700' : 'text-slate-500'">{{ statusKey(i) | translate }}</span>
          </span>
        </li>
      </ol>
    </nav>
  `,
})
export class CsvFlowStepperComponent {
  @Input({ required: true }) current: 'project' | 'upload' | 'preview' | 'mapping' | 'products' = 'project';

  steps = [
    { id: 'project', labelKey: 'flowStepper.steps.project' },
    { id: 'upload', labelKey: 'flowStepper.steps.upload' },
    { id: 'preview', labelKey: 'flowStepper.steps.preview' },
    { id: 'mapping', labelKey: 'flowStepper.steps.mapping' },
    { id: 'products', labelKey: 'flowStepper.steps.products' },
  ];

  currentIndex() { return Math.max(0, this.steps.findIndex(step => step.id === this.current)); }
  statusKey(index: number) {
    if (index < this.currentIndex()) return 'flowStepper.status.completed';
    if (index === this.currentIndex()) return 'flowStepper.status.current';
    return 'flowStepper.status.upcoming';
  }
  stepClass(index: number) {
    if (index < this.currentIndex()) return 'border-green-200 bg-green-50';
    if (index === this.currentIndex()) return 'border-blue-300 bg-blue-50 ring-1 ring-blue-200';
    return 'border-slate-200 bg-slate-50 opacity-75';
  }
  markerClass(index: number) {
    if (index < this.currentIndex()) return 'bg-green-600 text-white';
    if (index === this.currentIndex()) return 'bg-blue-700 text-white';
    return 'bg-slate-200 text-slate-500';
  }
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslateModule, RouterLink],
  template: `
    <section class="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'home.phaseBadge' | translate }}</p>
        <h2 class="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{{ 'home.title' | translate }}</h2>
        <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">{{ 'home.description' | translate }}</p>
        <div class="mt-6">
          <a routerLink="/projects/new" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {{ 'home.ctaCreateProject' | translate }}
          </a>
        </div>
      </div>

      <aside class="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h3 class="text-base font-semibold text-blue-950">{{ 'home.scopeTitle' | translate }}</h3>
        <p class="mt-2 text-sm leading-6 text-blue-900">{{ 'home.scopeText' | translate }}</p>
      </aside>
    </section>

    <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-semibold text-slate-950">{{ 'home.stepsTitle' | translate }}</h3>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">1</div>
          <p class="mt-3 font-medium text-slate-950">{{ 'home.steps.import' | translate }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">2</div>
          <p class="mt-3 font-medium text-slate-950">{{ 'home.steps.map' | translate }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">3</div>
          <p class="mt-3 font-medium text-slate-950">{{ 'home.steps.review' | translate }}</p>
        </div>
      </div>
    </section>
  `,
})
class HomeComponent {}

@Component({
  selector: 'app-new-project',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CsvFlowStepperComponent],
  template: `
    <section class="mx-auto max-w-3xl">
      <app-csv-flow-stepper current="project"></app-csv-flow-stepper>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'projectCreate.eyebrow' | translate }}</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ 'projectCreate.title' | translate }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ 'projectCreate.description' | translate }}</p>

        <form #projectForm="ngForm" class="mt-6 space-y-5" (ngSubmit)="submit(projectForm)" novalidate>
          <div>
            <label for="project-name" class="block text-sm font-medium text-slate-900">{{ 'projectCreate.fields.name.label' | translate }}</label>
            <input id="project-name" name="name" type="text" required minlength="3" maxlength="80" [(ngModel)]="form.name" #nameModel="ngModel" [placeholder]="'projectCreate.fields.name.placeholder' | translate" aria-describedby="project-name-help project-name-error" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" />
            <p id="project-name-help" class="mt-2 text-sm text-slate-500">{{ 'projectCreate.fields.name.help' | translate }}</p>
            <div id="project-name-error" class="mt-2 text-sm text-red-700" *ngIf="showFieldError(nameModel)">
              <p *ngIf="nameModel.errors?.['required']">{{ 'projectCreate.fields.name.errors.required' | translate }}</p>
              <p *ngIf="nameModel.errors?.['minlength']">{{ 'projectCreate.fields.name.errors.minlength' | translate }}</p>
              <p *ngIf="nameModel.errors?.['maxlength']">{{ 'projectCreate.fields.name.errors.maxlength' | translate }}</p>
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-3">
            <div>
              <label for="project-language" class="block text-sm font-medium text-slate-900">{{ 'projectCreate.fields.primaryLanguage.label' | translate }}</label>
              <input id="project-language" name="primaryLanguage" type="text" required pattern="^(fr|en)$" [(ngModel)]="form.primaryLanguage" #languageModel="ngModel" [placeholder]="'projectCreate.fields.primaryLanguage.placeholder' | translate" aria-describedby="project-language-help project-language-error" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 uppercase shadow-sm outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" />
              <p id="project-language-help" class="mt-2 text-sm text-slate-500">{{ 'projectCreate.fields.primaryLanguage.help' | translate }}</p>
              <div id="project-language-error" class="mt-2 text-sm text-red-700" *ngIf="showFieldError(languageModel)">
                <p *ngIf="languageModel.errors?.['required']">{{ 'projectCreate.fields.primaryLanguage.errors.required' | translate }}</p>
                <p *ngIf="languageModel.errors?.['pattern']">{{ 'projectCreate.fields.primaryLanguage.errors.pattern' | translate }}</p>
              </div>
            </div>

            <div>
              <label for="project-country" class="block text-sm font-medium text-slate-900">{{ 'projectCreate.fields.targetCountry.label' | translate }}</label>
              <input id="project-country" name="targetCountry" type="text" required pattern="^[A-Z]{2}$" maxlength="2" [(ngModel)]="form.targetCountry" (ngModelChange)="form.targetCountry = ($event || '').toUpperCase()" #countryModel="ngModel" [placeholder]="'projectCreate.fields.targetCountry.placeholder' | translate" aria-describedby="project-country-help project-country-error" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 uppercase shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" />
              <p id="project-country-help" class="mt-2 text-sm text-slate-500">{{ 'projectCreate.fields.targetCountry.help' | translate }}</p>
              <div id="project-country-error" class="mt-2 text-sm text-red-700" *ngIf="showFieldError(countryModel)">
                <p *ngIf="countryModel.errors?.['required']">{{ 'projectCreate.fields.targetCountry.errors.required' | translate }}</p>
                <p *ngIf="countryModel.errors?.['pattern']">{{ 'projectCreate.fields.targetCountry.errors.pattern' | translate }}</p>
              </div>
            </div>

            <div>
              <label for="project-currency" class="block text-sm font-medium text-slate-900">{{ 'projectCreate.fields.currency.label' | translate }}</label>
              <input id="project-currency" name="currency" type="text" required pattern="^[A-Z]{3}$" maxlength="3" [(ngModel)]="form.currency" (ngModelChange)="form.currency = ($event || '').toUpperCase()" #currencyModel="ngModel" [placeholder]="'projectCreate.fields.currency.placeholder' | translate" aria-describedby="project-currency-help project-currency-error" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 uppercase shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" />
              <p id="project-currency-help" class="mt-2 text-sm text-slate-500">{{ 'projectCreate.fields.currency.help' | translate }}</p>
              <div id="project-currency-error" class="mt-2 text-sm text-red-700" *ngIf="showFieldError(currencyModel)">
                <p *ngIf="currencyModel.errors?.['required']">{{ 'projectCreate.fields.currency.errors.required' | translate }}</p>
                <p *ngIf="currencyModel.errors?.['pattern']">{{ 'projectCreate.fields.currency.errors.pattern' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" *ngIf="error">
            {{ error | translate }}
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" [disabled]="projectForm.invalid || loading" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
              <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" *ngIf="loading"></span>
              {{ (loading ? 'states.creating' : 'common.create') | translate }}
            </button>
            <p class="text-sm text-slate-500">{{ 'projectCreate.submitHelp' | translate }}</p>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class NewProjectComponent {
  api = inject(ApiService);
  router = inject(Router);
  errs = inject(ErrorI18nService);
  loading = false;
  submitted = false;
  error = '';
  form = { name: '', primaryLanguage: '', targetCountry: '', currency: '' };

  showFieldError(model: any) { return !!model?.invalid && (model.dirty || model.touched || this.submitted); }

  submit(projectForm: NgForm) {
    this.submitted = true;
    this.error = '';
    if (projectForm.invalid || this.loading) {
      projectForm.control.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.api.createProject(this.form).subscribe({
      next: r => this.router.navigate(['/projects', r.id, 'upload']),
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.loading = false;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, CsvFlowStepperComponent],
  template: `
    <section class="mx-auto max-w-3xl">
      <app-csv-flow-stepper current="upload"></app-csv-flow-stepper>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'csvUpload.eyebrow' | translate }}</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ 'csvUpload.title' | translate }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ 'csvUpload.description' | translate }}</p>

        <div class="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
          <input id="csv-file" type="file" accept=".csv,text/csv" class="sr-only" (change)="pick($event)" />
          <label for="csv-file" class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
            {{ 'csvUpload.chooseFile' | translate }}
          </label>
          <p class="mt-3 text-sm text-slate-600">{{ 'csvUpload.dropHelp' | translate }}</p>
          <p class="mt-3 text-sm font-medium text-slate-950" *ngIf="file">{{ 'csvUpload.selectedFile' | translate }} {{ file.name }}</p>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'csvUpload.constraints.type' | translate }}</div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'csvUpload.constraints.size' | translate:{ max: csvMaxFileSizeMb } }}</div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'csvUpload.constraints.encoding' | translate }}</div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'csvUpload.constraints.delimiters' | translate }}</div>
        </div>

        <p class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">{{ 'csvUpload.sampleHelp' | translate }}</p>

        <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" *ngIf="error">
          {{ error | translate }}
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" (click)="upload()" [disabled]="!file || loading" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
            <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" *ngIf="loading"></span>
            {{ (loading ? 'states.analyzing' : 'csvUpload.submit') | translate }}
          </button>
          <p class="text-sm text-slate-500">{{ 'csvUpload.submitHelp' | translate }}</p>
        </div>
      </div>
    </section>
  `,
})
class UploadComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  api = inject(ApiService);
  errs = inject(ErrorI18nService);
  csvMaxFileSizeMb = CSV_MAX_FILE_SIZE_MB;
  file?: File;
  loading = false;
  error = '';

  pick(e: Event) {
    const target = e.target as HTMLInputElement;
    const f = target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      this.file = undefined;
      this.error = 'errors.CSV_INVALID_FILE_TYPE';
      return;
    }
    this.file = f;
    this.error = '';
  }

  upload() {
    if (!this.file) {
      this.error = 'errors.CSV_FILE_REQUIRED';
      return;
    }
    this.loading = true;
    this.error = '';
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.uploadCsv(id, this.file).subscribe({
      next: r => this.router.navigate(['/projects', id, 'preview'], { state: { preview: r } }),
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.loading = false;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, CsvFlowStepperComponent],
  template: `
    <section class="space-y-6">
      <app-csv-flow-stepper current="preview"></app-csv-flow-stepper>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'csvPreview.eyebrow' | translate }}</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ 'csvPreview.title' | translate }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ 'csvPreview.description' | translate }}</p>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" *ngIf="!preview">
        <p class="font-semibold">{{ 'states.emptyTitle' | translate }}</p>
        <p class="mt-1">{{ 'csvPreview.empty' | translate }}</p>
        <a routerLink="/" class="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-100">{{ 'common.backHome' | translate }}</a>
      </div>

      <ng-container *ngIf="preview">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">{{ 'csvPreview.delimiter' | translate }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ delimiterLabel() }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">{{ 'csvPreview.columnCount' | translate }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ preview.columns?.length || 0 }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">{{ 'csvPreview.rowCount' | translate }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ rowCount() }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-950">{{ 'csvPreview.columns' | translate }}</h3>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" *ngFor="let c of preview.columns">{{ c }}</span>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-950">{{ 'csvPreview.tableTitle' | translate }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ 'csvPreview.tableHelp' | translate }}</p>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <a [routerLink]="['/projects', projectId, 'upload']" class="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {{ 'common.back' | translate }}
              </a>
              <a [routerLink]="['/projects', projectId, 'mapping']" [state]="{ preview }" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {{ 'csvPreview.continue' | translate }}
              </a>
            </div>
          </div>
          <div class="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700" *ngFor="let c of preview.columns">{{ c }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr class="hover:bg-slate-50" *ngFor="let row of preview.previewRows | slice:0:20">
                  <td class="max-w-xs truncate px-4 py-3 text-slate-700" *ngFor="let c of preview.columns">{{ row[c] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-900">{{ 'prompts.limit' | translate }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ 'prompts.limitDetail' | translate:{ maxProducts: 5, promptsPerProduct: 5 } }}</p>
          <button type="button" (click)="generatePrompts()" [disabled]="selectedCount()===0 || selectedCount()>5 || generating" class="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{{ 'prompts.generate' | translate }}</button>
          <p class="mt-2 text-sm text-red-700" *ngIf="promptsError">{{ promptsError | translate }}</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" *ngIf="prompts.length">
          <h3 class="font-semibold">{{ 'prompts.title' | translate }}</h3>
          <div *ngFor="let group of groupedPrompts()" class="mt-3 border-t pt-3">
            <p class="text-sm font-medium">{{ productTitle(group.productId) }}</p>
            <div *ngFor="let pr of group.items" class="mt-2 rounded border p-2">
              <div class="mb-2 flex flex-wrap gap-2 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5">{{ promptStatusKey(pr.status) | translate }}</span>
                <span class="rounded bg-blue-50 px-2 py-0.5">{{ promptIntentKey(pr.intent) | translate }}</span>
                <span class="rounded bg-emerald-50 px-2 py-0.5">{{ promptSourceKey(pr.source) | translate }}</span>
              </div>
              <div class="flex gap-2">
              <input class="flex-1 rounded border px-2 py-1" [(ngModel)]="pr.text" />
              <button type="button" (click)="savePrompt(pr)" class="rounded bg-slate-100 px-2">{{ 'common.save' | translate }}</button>
              <button type="button" (click)="disablePrompt(pr)" class="rounded bg-red-100 px-2">{{ 'common.delete' | translate }}</button>
            </div>
            </div>
          </div>
          <p class="mt-2 text-sm text-green-700" *ngIf="promptsSuccess">{{ promptsSuccess | translate }}</p>
          <p class="mt-2 text-sm text-slate-500" *ngIf="promptsLoading">{{ "states.loading" | translate }}</p>
          <p class="mt-2 text-sm text-slate-500" *ngIf="!promptsLoading && !prompts.length">{{ "prompts.empty" | translate }}</p>
        </div>
      </ng-container>
    </section>
  `,
})
class PreviewComponent {
  private t = inject(TranslateService);
  route = inject(ActivatedRoute);
  preview: any = history.state?.preview;
  projectId = this.route.snapshot.paramMap.get('id');

  rowCount() { return this.preview?.totalRows ?? this.preview?.rowCount ?? this.preview?.rowsCount ?? this.preview?.previewRows?.length ?? 0; }
  delimiterLabel() {
    const delimiter = this.preview?.detectedDelimiter;
    if (delimiter === '\t') return this.t.instant('csvPreview.tabDelimiter');
    return delimiter || this.t.instant('states.notAvailable');
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, CsvFlowStepperComponent],
  template: `
    <section class="space-y-6">
      <app-csv-flow-stepper current="mapping"></app-csv-flow-stepper>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'csvMapping.eyebrow' | translate }}</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">{{ 'csvMapping.title' | translate }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ 'csvMapping.description' | translate }}</p>
      </div>

      <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" *ngIf="error">
        {{ error | translate }}
      </div>
      <div class="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800" *ngIf="success">
        {{ success | translate }}
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" *ngIf="loading">
        <div class="flex items-center gap-3 text-sm text-slate-600">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"></span>
          {{ 'states.loading' | translate }}
        </div>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" *ngIf="!preview && !loading">
        <p class="font-semibold">{{ 'states.emptyTitle' | translate }}</p>
        <p class="mt-1">{{ 'csvMapping.empty' | translate }}</p>
        <a routerLink="/" class="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-100">{{ 'common.backHome' | translate }}</a>
      </div>

      <ng-container *ngIf="preview">
        <div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-slate-950">{{ 'csvMapping.tableTitle' | translate }}</h3>
                <p class="mt-1 text-sm text-slate-500">{{ 'csvMapping.titleRequiredHelp' | translate }}</p>
              </div>
              <span class="inline-flex w-fit rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">{{ 'csvMapping.requiredBadge' | translate }}</span>
            </div>

            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-semibold text-slate-950">{{ 'csvMapping.summary.title' | translate }}</p>
                  <p class="mt-1 text-sm text-slate-600">{{ 'csvMapping.summary.help' | translate }}</p>
                </div>
                <span class="w-fit rounded-full px-3 py-1 text-sm font-semibold" [ngClass]="hasTitleMapping() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ (hasTitleMapping() ? 'csvMapping.summary.titleOk' : 'csvMapping.summary.titleMissing') | translate }}
                </span>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg bg-white p-3 ring-1 ring-inset ring-slate-200">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ 'csvMapping.summary.mapped' | translate }}</p>
                  <p class="mt-1 text-2xl font-bold text-slate-950">{{ mappedColumnsCount() }}</p>
                </div>
                <div class="rounded-lg bg-white p-3 ring-1 ring-inset ring-slate-200">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ 'csvMapping.summary.unmapped' | translate }}</p>
                  <p class="mt-1 text-2xl font-bold text-slate-950">{{ unmappedColumns().length }}</p>
                </div>
                <div class="rounded-lg bg-white p-3 ring-1 ring-inset ring-slate-200">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ 'csvMapping.summary.recommendedMissing' | translate }}</p>
                  <p class="mt-1 text-2xl font-bold text-slate-950">{{ missingRecommendedFieldKeys().length }}</p>
                </div>
              </div>
              <div class="mt-4" *ngIf="missingRecommendedFieldKeys().length">
                <p class="text-sm font-medium text-slate-700">{{ 'csvMapping.summary.recommendedMissingList' | translate }}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800" *ngFor="let key of missingRecommendedFieldKeys()">{{ key | translate }}</span>
                </div>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" *ngIf="hasRecommendedWarnings()">
              <p class="font-semibold">{{ 'csvMapping.recommendedWarningTitle' | translate }}</p>
              <p class="mt-1">{{ 'csvMapping.recommendedWarningText' | translate:{ fields: missingRecommendedLabels() } }}</p>
            </div>

            <div class="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700">{{ 'csvMapping.csvColumn' | translate }}</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700">{{ 'csvMapping.targetField' | translate }}</th>
                    <th class="px-4 py-3 text-left font-semibold text-slate-700">{{ 'csvMapping.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                  <tr class="hover:bg-slate-50" *ngFor="let c of preview.columns">
                    <td class="px-4 py-3 font-medium text-slate-900">
                      <label [for]="fieldId(c)">{{ c }}</label>
                    </td>
                    <td class="px-4 py-3">
                      <select [id]="fieldId(c)" [(ngModel)]="mapping[c]" [name]="c" (ngModelChange)="onMappingChange()" class="w-full min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30">
                        <option value="">{{ 'csvMapping.noTarget' | translate }}</option>
                        <option *ngFor="let f of fields" [value]="f">{{ ('csvMapping.fields.' + f) | translate }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700" *ngIf="isAutoMapped(c)">{{ 'csvMapping.autoMapped' | translate }}</span>
                      <span class="ml-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700" *ngIf="isRecommendedMapping(c)">{{ 'csvMapping.recommendedBadge' | translate }}</span>
                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" *ngIf="!mapping[c]">{{ 'csvMapping.unmappedBadge' | translate }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4" *ngIf="unmappedColumns().length">
              <p class="text-sm font-semibold text-slate-900">{{ 'csvMapping.unmappedTitle' | translate }}</p>
              <p class="mt-1 text-sm text-slate-600">{{ 'csvMapping.unmappedHelp' | translate }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200" *ngFor="let c of unmappedColumns()">{{ c }}</span>
              </div>
            </div>

            <p class="mt-3 text-sm text-red-700" *ngIf="mappingTouched && !hasTitleMapping()">{{ 'errors.CSV_MAPPING_MISSING_TITLE' | translate }}</p>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <a [routerLink]="['/projects', projectId(), 'preview']" [state]="{ preview }" class="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {{ 'common.back' | translate }}
              </a>
              <button type="button" (click)="save()" [disabled]="saving || importing" class="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
                <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" *ngIf="saving"></span>
                {{ (saving ? 'states.saving' : 'csvMapping.save') | translate }}
              </button>
              <button type="button" (click)="importProducts()" [disabled]="!hasTitleMapping() || importing || loading" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">
                <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" *ngIf="importing"></span>
                {{ (importing ? 'states.savingAndImporting' : 'csvMapping.saveAndImport') | translate }}
              </button>
            </div>
            <p class="mt-3 text-sm text-slate-500">{{ 'csvMapping.saveAndImportNote' | translate }}</p>
          </div>

          <aside class="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950 shadow-sm">
            <h3 class="font-semibold">{{ 'csvMapping.recommendedTitle' | translate }}</h3>
            <p class="mt-2 leading-6">{{ 'csvMapping.recommendedText' | translate }}</p>
            <ul class="mt-4 space-y-2 text-blue-900">
              <li>{{ 'csvMapping.recommended.description' | translate }}</li>
              <li>{{ 'csvMapping.recommended.price' | translate }}</li>
              <li>{{ 'csvMapping.recommended.url' | translate }}</li>
              <li>{{ 'csvMapping.recommended.taxonomy' | translate }}</li>
            </ul>
          </aside>
        </div>
      

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-900">{{ 'prompts.limit' | translate }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ 'prompts.limitDetail' | translate:{ maxProducts: 5, promptsPerProduct: 5 } }}</p>
          <button type="button" (click)="generatePrompts()" [disabled]="selectedCount()===0 || selectedCount()>5 || generating" class="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{{ 'prompts.generate' | translate }}</button>
          <p class="mt-2 text-sm text-red-700" *ngIf="promptsError">{{ promptsError | translate }}</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" *ngIf="prompts.length">
          <h3 class="font-semibold">{{ 'prompts.title' | translate }}</h3>
          <div *ngFor="let group of groupedPrompts()" class="mt-3 border-t pt-3">
            <p class="text-sm font-medium">{{ productTitle(group.productId) }}</p>
            <div *ngFor="let pr of group.items" class="mt-2 rounded border p-2">
              <div class="mb-2 flex flex-wrap gap-2 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5">{{ promptStatusKey(pr.status) | translate }}</span>
                <span class="rounded bg-blue-50 px-2 py-0.5">{{ promptIntentKey(pr.intent) | translate }}</span>
                <span class="rounded bg-emerald-50 px-2 py-0.5">{{ promptSourceKey(pr.source) | translate }}</span>
              </div>
              <div class="flex gap-2">
              <input class="flex-1 rounded border px-2 py-1" [(ngModel)]="pr.text" />
              <button type="button" (click)="savePrompt(pr)" class="rounded bg-slate-100 px-2">{{ 'common.save' | translate }}</button>
              <button type="button" (click)="disablePrompt(pr)" class="rounded bg-red-100 px-2">{{ 'common.delete' | translate }}</button>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
})
export class MappingComponent {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  errs = inject(ErrorI18nService);
  t = inject(TranslateService);
  preview: any = history.state?.preview;
  mapping: Record<string, string> = {};
  autoMappedColumns = new Set<string>();
  loading = false;
  saving = false;
  importing = false;
  mappingTouched = false;
  error = '';
  success = '';
  fields = ['title', 'description', 'price', 'sku', 'brand', 'vendor', 'productType', 'category', 'url', 'imageUrls', 'gtin', 'availability', 'tags', 'seoTitle', 'metaDescription'];
  recommendedFields = new Set(['description', 'price', 'url', 'brand', 'category', 'productType']);

  ngOnInit() {
    if (!this.preview) {
      this.error = 'states.empty';
      return;
    }
    this.loading = true;
    this.api.saveMapping(this.projectId(), this.preview.id).subscribe({
      next: r => {
        this.mapping = r.mapping || {};
        this.autoMappedColumns = new Set(Object.keys(this.mapping).filter(c => !!this.mapping[c]));
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.loading = false;
      },
    });
  }

  projectId() { return this.route.snapshot.paramMap.get('id')!; }
  fieldId(column: string) { return `mapping-${column.replace(/[^a-zA-Z0-9_-]/g, '-')}`; }
  hasTitleMapping() { return Object.values(this.mapping).includes('title'); }
  isAutoMapped(column: string) { return this.autoMappedColumns.has(column) && !!this.mapping[column]; }
  isRecommendedMapping(column: string) { return this.recommendedFields.has(this.mapping[column]); }
  mappedColumnsCount() { return (this.preview?.columns || []).filter((column: string) => !!this.mapping[column]).length; }
  unmappedColumns() { return (this.preview?.columns || []).filter((column: string) => !this.mapping[column]); }
  missingRecommendedFieldKeys() {
    const values = Object.values(this.mapping);
    const missing = ['description', 'price', 'url', 'brand']
      .filter(field => !values.includes(field))
      .map(field => `csvMapping.fields.${field}`);
    if (!values.includes('category') && !values.includes('productType')) missing.push('csvMapping.summary.taxonomyGroup');
    return missing;
  }
  missingRecommendedLabels() { return this.missingRecommendedFieldKeys().map(key => this.t.instant(key)).join(', '); }
  hasRecommendedWarnings() { return !Object.values(this.mapping).includes('price') || !Object.values(this.mapping).includes('url'); }
  onMappingChange() { this.mappingTouched = true; this.success = ''; }

  save() {
    this.mappingTouched = true;
    this.success = '';
    if (!this.hasTitleMapping()) {
      this.error = 'errors.CSV_MAPPING_MISSING_TITLE';
      return;
    }
    this.saving = true;
    this.error = '';
    this.api.saveMapping(this.projectId(), this.preview.id, this.mapping).subscribe({
      next: () => {
        this.success = 'csvMapping.saveSuccess';
        this.saving = false;
      },
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.saving = false;
      },
    });
  }

  importProducts() {
    this.mappingTouched = true;
    this.success = '';
    if (!this.hasTitleMapping()) {
      this.error = 'errors.CSV_MAPPING_MISSING_TITLE';
      return;
    }
    this.importing = true;
    this.error = '';
    this.api.saveMapping(this.projectId(), this.preview.id, this.mapping).subscribe({
      next: () => this.api.importProducts(this.projectId()).subscribe({
        next: () => this.router.navigate(['/projects', this.projectId(), 'products']),
        error: (e: HttpErrorResponse) => {
          this.error = this.errs.getKey((e.error as ApiError)?.code);
          this.importing = false;
        },
      }),
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.importing = false;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, CsvFlowStepperComponent],
  template: `
    <section class="space-y-6">
      <app-csv-flow-stepper current="products"></app-csv-flow-stepper>
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">{{ 'products.eyebrow' | translate }}</p>
        <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-950">{{ 'products.title' | translate }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ 'products.description' | translate }}</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <a [routerLink]="['/projects', projectId, 'upload']" class="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{{ 'products.importAnotherCsv' | translate }}</a>
            <a routerLink="/projects/new" class="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{{ 'products.createAnother' | translate }}</a>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" *ngIf="loading">
        <div class="flex items-center gap-3 text-sm text-slate-600">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"></span>
          {{ 'states.loading' | translate }}
        </div>
      </div>

      <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" *ngIf="error">
        {{ error | translate }}
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" *ngIf="!loading && !error && products.length === 0">
        <p class="font-semibold">{{ 'states.emptyTitle' | translate }}</p>
        <p class="mt-1">{{ 'products.empty' | translate }}</p>
        <a routerLink="/" class="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-100">{{ 'common.backHome' | translate }}</a>
      </div>

      <ng-container *ngIf="products.length">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">{{ 'products.summary.countLabel' | translate }}</p>
            <p class="mt-2 text-2xl font-bold text-slate-950">{{ products.length }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p class="text-sm text-slate-500">{{ 'products.summary.projectLabel' | translate }}</p>
            <p class="mt-2 break-all text-lg font-semibold text-slate-950">{{ projectId }}</p>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3"></th>
                  <th class="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700" *ngFor="let c of cols">{{ ('products.columns.' + c) | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr class="transition odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/60" *ngFor="let p of products">
                  <td class="px-4 py-3"><input type="checkbox" [checked]="selected[p.id]" (change)="toggleProduct(p.id,$event)"/></td>
                  <td class="max-w-xs px-4 py-3 font-medium text-slate-950">{{ p.title || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ p.sku || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ p.brand || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ p.category || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ formatPrice(p) || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ p.currency || ('states.notAvailable' | translate) }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [ngClass]="availabilityClass(p.availability)">{{ p.availability || ('states.notAvailable' | translate) }}</span>
                  </td>
                  <td class="max-w-xs px-4 py-3">
                    <a *ngIf="p.url" [href]="p.url" target="_blank" rel="noreferrer" class="break-all font-medium text-blue-700 hover:text-blue-900 hover:underline">{{ p.url }}</a>
                    <span *ngIf="!p.url" class="text-slate-500">{{ 'states.notAvailable' | translate }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-semibold text-slate-900">{{ 'prompts.limit' | translate }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ 'prompts.limitDetail' | translate:{ maxProducts: 5, promptsPerProduct: 5 } }}</p>
          <button type="button" (click)="generatePrompts()" [disabled]="selectedCount()===0 || selectedCount()>5 || generating" class="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{{ 'prompts.generate' | translate }}</button>
          <p class="mt-2 text-sm text-red-700" *ngIf="promptsError">{{ promptsError | translate }}</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" *ngIf="prompts.length">
          <h3 class="font-semibold">{{ 'prompts.title' | translate }}</h3>
          <div *ngFor="let group of groupedPrompts()" class="mt-3 border-t pt-3">
            <p class="text-sm font-medium">{{ productTitle(group.productId) }}</p>
            <div *ngFor="let pr of group.items" class="mt-2 rounded border p-2">
              <div class="mb-2 flex flex-wrap gap-2 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5">{{ promptStatusKey(pr.status) | translate }}</span>
                <span class="rounded bg-blue-50 px-2 py-0.5">{{ promptIntentKey(pr.intent) | translate }}</span>
                <span class="rounded bg-emerald-50 px-2 py-0.5">{{ promptSourceKey(pr.source) | translate }}</span>
              </div>
              <div class="flex gap-2">
              <input class="flex-1 rounded border px-2 py-1" [(ngModel)]="pr.text" />
              <button type="button" (click)="savePrompt(pr)" class="rounded bg-slate-100 px-2">{{ 'common.save' | translate }}</button>
              <button type="button" (click)="disablePrompt(pr)" class="rounded bg-red-100 px-2">{{ 'common.delete' | translate }}</button>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
})
class ProductsComponent {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  errs = inject(ErrorI18nService);
  t = inject(TranslateService);
  products: any[] = [];
  loading = true;
  error = '';
  projectId = this.route.snapshot.paramMap.get('id')!;
  cols = ['title', 'sku', 'brand', 'category', 'price', 'currency', 'availability', 'url'];
  selected: Record<string, boolean> = {};
  prompts: ProductPrompt[] = [];
  promptsSuccess = "";
  promptsLoading = false;
  generating = false;
  promptsError = '';

  ngOnInit() {
    this.api.listProducts(this.projectId).subscribe({
      next: r => {
        this.products = r;
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.error = this.errs.getKey((e.error as ApiError)?.code);
        this.loading = false;
      },
    });
  }

  formatPrice(product: any) {
    if (product.price === null || product.price === undefined || product.price === '') return '';
    const amount = Number(product.price);
    if (Number.isNaN(amount)) return String(product.price);
    try {
      return new Intl.NumberFormat(this.t.currentLang || 'fr', { style: 'currency', currency: product.currency || 'EUR' }).format(amount);
    } catch {
      return `${amount} ${product.currency || ''}`.trim();
    }
  }


  toggleProduct(id: string, event: Event) { this.selected[id] = (event.target as HTMLInputElement).checked; }
  selectedCount() { return Object.values(this.selected).filter(Boolean).length; }
  productTitle(productId: string) { return this.products.find(p => p.id === productId)?.title || productId; }
  groupedPrompts() { const map: Record<string, ProductPrompt[]> = {}; for (const p of this.prompts) { map[p.productId] = map[p.productId] || []; map[p.productId].push(p); } return Object.entries(map).map(([productId, items]) => ({ productId, items })); }
  generatePrompts() {
    const productIds = Object.entries(this.selected).filter(([,v])=>v).map(([k])=>k);
    if (!productIds.length) { this.promptsError='errors.PROMPT_GENERATION_NO_PRODUCTS'; return; }
    this.generating=true; this.promptsLoading=true; this.promptsError=''; this.promptsSuccess='';
    this.api.generatePrompts(this.projectId,{productIds,promptsPerProduct:5,language:this.t.currentLang||'fr'}).subscribe({
      next:()=>this.api.listPrompts(this.projectId).subscribe({next:r=>{this.prompts=r;this.generating=false;this.promptsLoading=false;}}),
      error:(e:HttpErrorResponse)=>{this.promptsError=this.errs.getKey((e.error as ApiError)?.code);this.generating=false;this.promptsLoading=false;},
    });
  }
  savePrompt(prompt: ProductPrompt) {
    this.promptsError=''; this.promptsSuccess='';
    this.api.updatePrompt(this.projectId, prompt.id, { text: prompt.text, status: 'edited' }).subscribe({
      next: updated => { this.prompts = this.prompts.map(p => p.id === updated.id ? updated : p); this.promptsSuccess='prompts.updateSuccess'; },
      error: (e: HttpErrorResponse) => { this.promptsError=this.errs.getKey((e.error as ApiError)?.code); },
    });
  }
  disablePrompt(prompt: ProductPrompt) {
    this.promptsError=''; this.promptsSuccess='';
    this.api.deletePrompt(this.projectId, prompt.id).subscribe({
      next:()=>{this.prompts=this.prompts.filter(p=>p.id!==prompt.id); this.promptsSuccess='prompts.deleteSuccess';},
      error:(e: HttpErrorResponse)=>{this.promptsError=this.errs.getKey((e.error as ApiError)?.code);},
    });
  }

  promptStatusKey(status: string) { return `prompts.status.${status}`; }
  promptIntentKey(intent: string) { return `prompts.intent.${intent}`; }
  promptSourceKey(source: string) { return `prompts.source.${source}`; }

  availabilityClass(value?: string) {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('in') || normalized.includes('available')) return 'bg-green-50 text-green-700';
    if (normalized.includes('out') || normalized.includes('unavailable')) return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-700';
  }
}

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'projects/new', component: NewProjectComponent },
  { path: 'projects/:id/upload', component: UploadComponent },
  { path: 'projects/:id/preview', component: PreviewComponent },
  { path: 'projects/:id/mapping', component: MappingComponent },
  { path: 'projects/:id/products', component: ProductsComponent },
];
export const APP_ROUTES = routes;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="min-h-screen bg-slate-50 text-slate-950">
      <header class="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a routerLink="/" class="text-xl font-bold tracking-tight text-slate-950">{{ 'app.title' | translate }}</a>
            <p class="mt-1 text-sm text-slate-500">{{ 'app.subtitle' | translate }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <nav class="flex items-center gap-2 text-sm font-medium">
              <a routerLink="/" routerLinkActive="bg-slate-100 text-slate-950" [routerLinkActiveOptions]="{ exact: true }" class="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">{{ 'nav.home' | translate }}</a>
              <a routerLink="/projects/new" routerLinkActive="bg-slate-100 text-slate-950" class="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">{{ 'nav.newProject' | translate }}</a>
            </nav>
            <div class="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button type="button" (click)="setLang('fr')" class="rounded-md px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500" [ngClass]="currentLang() === 'fr' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'">{{ 'app.language.fr' | translate }}</button>
              <button type="button" (click)="setLang('en')" class="rounded-md px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500" [ngClass]="currentLang() === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'">{{ 'app.language.en' | translate }}</button>
            </div>
          </div>
        </div>
      </header>
      <div class="mx-auto max-w-6xl px-4 py-8">
        <router-outlet />
      </div>
    </main>
  `,
})
export class AppComponent {
  private t = inject(TranslateService);

  constructor() {
    const l = localStorage.getItem('lang') || 'fr';
    this.t.use(l);
  }

  currentLang() { return this.t.currentLang || this.t.defaultLang || 'fr'; }
  setLang(l: string) { this.t.use(l); localStorage.setItem('lang', l); }
}

export const APP_PROVIDERS = [provideRouter(routes)];
