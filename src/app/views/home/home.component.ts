import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BannerService } from 'src/app/services/banner.service';
import { LogoService } from 'src/app/services/logo.service';
import { FaqService, FaqItem } from 'src/app/services/faq.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent  implements OnInit, OnDestroy{
  perguntasHome: FaqItem[] = [];

  constructor(private router: Router, private bannerService: BannerService, private logoService: LogoService, private faqService: FaqService) {}

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }

  irParaSobreNos(): void {
    this.router.navigate(['/sobre']);
  }

  irParaCuriosidades(): void {
    this.router.navigate(['/curiosidades']);
  }

  // Lista de imagens
  images: string[] = [];

  // logos
  logos: string[] = [];
  trackLogos: string[] = [];

  // Estado do Carrossel
  currentIndex = 0;
  private slideInterval: any;

  ngOnInit(): void {
    this.bannerService.homeBanners$.subscribe(b => {
      this.images = b.slice();
      this.currentIndex = 0;
    });
    this.logoService.logos$.subscribe(l => {
      this.logos = l.slice();
      this.trackLogos = this.logos.concat(this.logos);
    });
    this.faqService.home$.subscribe(h => {
      this.perguntasHome = Array.isArray(h) ? h.slice() : [];
    });
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      this.moveSlide(1);
    }, 3000);
  }

  pauseSlide(): void {
    clearInterval(this.slideInterval);
  }

  moveSlide(direction: number): void {
    const newIndex = this.currentIndex + direction;

    if (newIndex < 0) {
      this.currentIndex = this.images.length - 1;
    } else if (newIndex >= this.images.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = newIndex;
    }
  }
}
