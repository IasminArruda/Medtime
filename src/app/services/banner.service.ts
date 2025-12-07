import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private HOME_KEY = 'banners_home';
  private DASH_KEY = 'banners_dashboard';

  private defaultHome = [
    'assets/img/carrossel/1.svg',
    'assets/img/carrossel/2.svg',
    'assets/img/carrossel/3.svg',
    'assets/img/carrossel/4.svg',
    'assets/img/carrossel/5.svg',
    'assets/img/carrossel/6.svg',
  ];

  private defaultDash = [
    'assets/img/carrossel2/1.svg',
    'assets/img/carrossel2/2.svg',
    'assets/img/carrossel2/3.svg',
    'assets/img/carrossel2/4.svg',
    'assets/img/carrossel2/5.svg',
  ];

  private homeSubject = new BehaviorSubject<string[]>(this.load(this.HOME_KEY, this.defaultHome));
  private dashSubject = new BehaviorSubject<string[]>(this.load(this.DASH_KEY, this.defaultDash));

  homeBanners$ = this.homeSubject.asObservable();
  dashboardBanners$ = this.dashSubject.asObservable();

  private load(key: string, fallback: string[]): string[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return fallback.slice();
  }

  private save(key: string, arr: string[]) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { }
  }

  setHome(banners: string[]) {
    this.homeSubject.next(banners.slice());
    this.save(this.HOME_KEY, banners);
  }

  setDashboard(banners: string[]) {
    this.dashSubject.next(banners.slice());
    this.save(this.DASH_KEY, banners);
  }

  addToHome(url: string) {
    const arr = this.homeSubject.getValue().slice();
    arr.push(url);
    this.setHome(arr);
  }

  addToDashboard(url: string) {
    const arr = this.dashSubject.getValue().slice();
    arr.push(url);
    this.setDashboard(arr);
  }

  removeFromHome(index: number) {
    const arr = this.homeSubject.getValue().slice();
    arr.splice(index, 1);
    this.setHome(arr);
  }

  removeFromDashboard(index: number) {
    const arr = this.dashSubject.getValue().slice();
    arr.splice(index, 1);
    this.setDashboard(arr);
  }

  updateHome(index: number, url: string) {
    const arr = this.homeSubject.getValue().slice();
    arr[index] = url;
    this.setHome(arr);
  }

  updateDashboard(index: number, url: string) {
    const arr = this.dashSubject.getValue().slice();
    arr[index] = url;
    this.setDashboard(arr);
  }
}
