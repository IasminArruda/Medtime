import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface CuriosidadeItem {
  id: string;
  title: string;
  text: string;
  img?: string;
}

@Injectable({ providedIn: 'root' })
export class CuriosidadesService {
  private readonly STORAGE_KEY = 'curiosidades_list';
  private subj = new BehaviorSubject<CuriosidadeItem[]>([]);
  curiosidades$ = this.subj.asObservable();

  constructor(private translate: TranslateService) {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as CuriosidadeItem[];
        this.subj.next(arr || []);
        return;
      }
    } catch (e) {}

    this.translate.get(['CURIOSITIES.Q1_TITLE','CURIOSITIES.Q1_TEXT','CURIOSITIES.Q2_TITLE','CURIOSITIES.Q2_TEXT']).subscribe(res => {
      const out: CuriosidadeItem[] = [];
      const q1 = res['CURIOSITIES.Q1_TITLE'] || '';
      const t1 = res['CURIOSITIES.Q1_TEXT'] || '';
      const q2 = res['CURIOSITIES.Q2_TITLE'] || '';
      const t2 = res['CURIOSITIES.Q2_TEXT'] || '';
      if (q1 || t1) out.push({ id: 'q1', title: q1, text: t1, img: '' });
      if (q2 || t2) out.push({ id: 'q2', title: q2, text: t2, img: '' });
      this.subj.next(out);
      this.save();
    });
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.subj.value || []));
    } catch (e) {}
  }

  add(item: CuriosidadeItem) {
    const next = (this.subj.value || []).slice();
    next.push(item);
    this.subj.next(next);
    this.save();
  }

  update(index: number, item: CuriosidadeItem) {
    const next = (this.subj.value || []).slice();
    next[index] = item;
    this.subj.next(next);
    this.save();
  }

  remove(index: number) {
    const next = (this.subj.value || []).slice();
    next.splice(index, 1);
    this.subj.next(next);
    this.save();
  }
}
