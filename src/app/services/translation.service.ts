import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translate = inject(TranslateService);
  private storageKey = 'medtime-app-language';

  init() {
    const stored = localStorage.getItem(this.storageKey);
    const browserLang = (navigator.language || (navigator as any).userLanguage || 'pt-BR');
    const defaultLang = stored || browserLang || 'pt-BR';
    const supported = ['pt-BR', 'en-US', 'es', 'fr'];
    const active = supported.includes(defaultLang) ? defaultLang : 'pt-BR';
    this.translate.setDefaultLang('pt-BR');
    this.translate.use(active);
  }

  use(lang: string) {
    try {
      localStorage.setItem(this.storageKey, lang);
    } catch (e) {
      console.warn('Não foi possível salvar idioma no localStorage', e);
    }
    return this.translate.use(lang);
  }

  instant(key: string, params?: any) {
    return this.translate.instant(key, params);
  }

  get currentLang() {
    return this.translate.currentLang || localStorage.getItem(this.storageKey) || 'pt-BR';
  }
}
