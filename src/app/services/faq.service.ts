import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface FaqItem {
  q: string;
  a: string;
}

@Injectable({ providedIn: 'root' })
export class FaqService {
  private HOME_KEY = 'faq_home_translations';
  private DASH_KEY = 'faq_dash_translations';
  private homeMap: { [lang: string]: FaqItem[] } = {};
  private dashMap: { [lang: string]: FaqItem[] } = {};
  private _home$ = new BehaviorSubject<FaqItem[]>([]);
  private _dash$ = new BehaviorSubject<FaqItem[]>([]);
  public home$ = this._home$.asObservable();
  public dashboard$ = this._dash$.asObservable();
  private supportedLangs = ['pt-BR', 'en-US', 'es', 'fr'];

  constructor(private translate: TranslateService) {
    this.loadAll().then(() => {
      const cur = this.translate.currentLang || 'pt-BR';
      this.emitForLang(cur);
    });

    this.translate.onLangChange.subscribe(evt => {
      this.emitForLang(evt.lang || 'pt-BR');
    });
  }

  private async loadAll(): Promise<void> {
    try {

      const rawHome = localStorage.getItem(this.HOME_KEY);
      const rawDash = localStorage.getItem(this.DASH_KEY);
      if (rawHome) this.homeMap = JSON.parse(rawHome);
      if (rawDash) this.dashMap = JSON.parse(rawDash);

      for (const lang of this.supportedLangs) {
        if (!this.homeMap[lang]) {

          const keys: string[] = [];
          for (let i = 1; i <= 6; i++) {
            keys.push(`LOGIN.FAQ_Q${i}`, `FAQ_Q${i}`, `LOGIN.FAQ_A${i}`, `FAQ_A${i}`);
          }
          const t = await this.translate.get(keys, { lang }).toPromise();
          const home: FaqItem[] = [];
          for (let i = 1; i <= 6; i++) {
            const q = t[`LOGIN.FAQ_Q${i}`] || t[`FAQ_Q${i}`] || '';
            const a = t[`LOGIN.FAQ_A${i}`] || t[`FAQ_A${i}`] || '';
            home.push({ q, a });
          }
          this.homeMap[lang] = home;
        }

        if (!this.dashMap[lang]) {

          const keys: string[] = [];
          for (let i = 1; i <= 6; i++) {
            keys.push(`DASHBOARD.FAQ_Q${i}`, `FAQ_Q${i}`, `DASHBOARD.FAQ_A${i}`, `FAQ_A${i}`);
          }
          const t = await this.translate.get(keys, { lang }).toPromise();
          const dash: FaqItem[] = [];
          for (let i = 1; i <= 6; i++) {
            const q = t[`DASHBOARD.FAQ_Q${i}`] || t[`FAQ_Q${i}`] || '';
            const a = t[`DASHBOARD.FAQ_A${i}`] || t[`FAQ_A${i}`] || '';
            dash.push({ q, a });
          }
          this.dashMap[lang] = dash;
        }
      }

      try { localStorage.setItem(this.HOME_KEY, JSON.stringify(this.homeMap)); } catch (e) {}
      try { localStorage.setItem(this.DASH_KEY, JSON.stringify(this.dashMap)); } catch (e) {}
    } catch (e) {

      const defaultsHome: FaqItem[] = [];
      const defaultsDash: FaqItem[] = [];
      for (let i = 1; i <= 6; i++) {
        defaultsHome.push({ q: this.translate.instant(`LOGIN.FAQ_Q${i}`) || this.translate.instant(`FAQ_Q${i}`) || '', a: this.translate.instant(`LOGIN.FAQ_A${i}`) || this.translate.instant(`FAQ_A${i}`) || '' });
        defaultsDash.push({ q: this.translate.instant(`DASHBOARD.FAQ_Q${i}`) || '', a: this.translate.instant(`DASHBOARD.FAQ_A${i}`) || '' });
      }
      const cur = this.translate.currentLang || 'pt-BR';
      this.homeMap[cur] = defaultsHome;
      this.dashMap[cur] = defaultsDash;
    }
  }

  private emitForLang(lang: string) {
    const l = this.homeMap[lang] || this.homeMap['pt-BR'] || [];
    const d = this.dashMap[lang] || this.dashMap['pt-BR'] || [];
    this._home$.next(l.slice());
    this._dash$.next(d.slice());
  }

  updateHome(index: number, item: FaqItem) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.homeMap[lang] || []).slice();
    if (index < 0 || index >= list.length) return;
    list[index] = item;
    this.homeMap[lang] = list;
    try { localStorage.setItem(this.HOME_KEY, JSON.stringify(this.homeMap)); } catch (e) {}
    this.emitForLang(lang);
  }

  updateDash(index: number, item: FaqItem) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.dashMap[lang] || []).slice();
    if (index < 0 || index >= list.length) return;
    list[index] = item;
    this.dashMap[lang] = list;
    try { localStorage.setItem(this.DASH_KEY, JSON.stringify(this.dashMap)); } catch (e) {}
    this.emitForLang(lang);
  }

  removeHome(index: number) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.homeMap[lang] || []).slice();
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    this.homeMap[lang] = list;
    try { localStorage.setItem(this.HOME_KEY, JSON.stringify(this.homeMap)); } catch (e) {}
    this.emitForLang(lang);
  }

  removeDash(index: number) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.dashMap[lang] || []).slice();
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    this.dashMap[lang] = list;
    try { localStorage.setItem(this.DASH_KEY, JSON.stringify(this.dashMap)); } catch (e) {}
    this.emitForLang(lang);
  }

  addHome(item: FaqItem) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.homeMap[lang] || []).slice();
    list.push(item);
    this.homeMap[lang] = list;
    try { localStorage.setItem(this.HOME_KEY, JSON.stringify(this.homeMap)); } catch (e) {}
    this.emitForLang(lang);
  }

  addDash(item: FaqItem) {
    const lang = this.translate.currentLang || 'pt-BR';
    const list = (this.dashMap[lang] || []).slice();
    list.push(item);
    this.dashMap[lang] = list;
    try { localStorage.setItem(this.DASH_KEY, JSON.stringify(this.dashMap)); } catch (e) {}
    this.emitForLang(lang);
  }
}
