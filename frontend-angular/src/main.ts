import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent, APP_PROVIDERS } from './app/app.component';

export function httpLoaderFactory(http: HttpClient) { return new TranslateHttpLoader(http, '/assets/i18n/', '.json'); }
bootstrapApplication(AppComponent,{providers:[...APP_PROVIDERS,provideHttpClient(),importProvidersFrom(TranslateModule.forRoot({defaultLanguage:'fr',loader:{provide:TranslateLoader,useFactory:httpLoaderFactory,deps:[HttpClient]}}))]});
