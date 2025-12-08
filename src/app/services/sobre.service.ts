import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface SobreItem {
  id: string;
  text: string;
  img: string;
}

@Injectable({
  providedIn: 'root'
})
export class SobreService {

  private sobreSubject = new BehaviorSubject<SobreItem[]>([]);
  sobre$ = this.sobreSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.load();
  }

  private load() {
    try {
      const data = localStorage.getItem('sobre_nos');
      if (data) {
        const parsed: SobreItem[] = JSON.parse(data) || [];
        while (parsed.length < 4) {
          const idx = parsed.length + 1;
          parsed.push({ id: `sobre-${idx}`, text: '', img: '' });
        }
        try { localStorage.setItem('sobre_nos', JSON.stringify(parsed)); } catch {}
        this.sobreSubject.next(parsed);
      } else {
        const initial: SobreItem[] = [
          { id: 'sobre-1', text: this.translate.instant('ABOUT.KNOW_MEDTIME_TEXT') || 'Texto 1', img: '' },
          { id: 'sobre-2', text: this.translate.instant('ABOUT.OUR_OBJECTIVE_TEXT') || 'Texto 2', img: '' },
          { id: 'sobre-3', text: this.translate.instant('ABOUT.BEHIND_MEDTIME_TEXT') || 'Texto 3', img: '' },
          { id: 'sobre-4', text: '', img: '' }
        ];
        try { localStorage.setItem('sobre_nos', JSON.stringify(initial)); } catch {}
        this.sobreSubject.next(initial);
      }
    } catch (e) {
      this.sobreSubject.next([]);
    }
  }

  getList() {
    return this.sobreSubject.getValue();
  }

  update(index: number, item: SobreItem) {
    const list = this.getList();
    list[index] = item;
    try {
      localStorage.setItem('sobre_nos', JSON.stringify(list));
    } catch {}
    this.sobreSubject.next(list.slice());
  }
}
