import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LogoService {
  private KEY = 'logos_list';

  private defaultLogos = [
    'assets/img/marcas/1.svg',
    'assets/img/marcas/2.svg',
    'assets/img/marcas/3.svg',
    'assets/img/marcas/4.svg',
    'assets/img/marcas/5.svg',
  ];

  private subject = new BehaviorSubject<string[]>(this.load());
  logos$ = this.subject.asObservable();

  private load(): string[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return this.defaultLogos.slice();
  }

  private save(arr: string[]) {
    try { localStorage.setItem(this.KEY, JSON.stringify(arr)); } catch (e) {}
  }

  setAll(arr: string[]) {
    this.subject.next(arr.slice());
    this.save(arr);
  }

  add(url: string) {
    const arr = this.subject.getValue().slice();
    arr.push(url);
    this.setAll(arr);
  }

  update(index: number, url: string) {
    const arr = this.subject.getValue().slice();
    arr[index] = url;
    this.setAll(arr);
  }

  remove(index: number) {
    const arr = this.subject.getValue().slice();
    arr.splice(index, 1);
    this.setAll(arr);
  }
}
