import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
@Component({selector:'app-root',standalone:true,imports:[TranslateModule],template:`<main class='p-6'><h1 class='text-2xl font-bold'>{{'app.title'|translate}}</h1><button class='mr-2' (click)='setLang("fr")'>FR</button><button (click)='setLang("en")'>EN</button><p>{{'home.description'|translate}}</p></main>`})
export class AppComponent { private t=inject(TranslateService); constructor(){const l=localStorage.getItem('lang')||'fr'; this.t.use(l);} setLang(l:string){this.t.use(l); localStorage.setItem('lang',l);} }
