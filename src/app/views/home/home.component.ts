import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent  implements OnInit, OnDestroy{
  constructor(private router: Router) {}

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
  images = [
    'assets/img/carrossel/1.svg',
    'assets/img/carrossel/2.svg',
    'assets/img/carrossel/3.svg',
    'assets/img/carrossel/4.svg',
    'assets/img/carrossel/5.svg',
    'assets/img/carrossel/6.svg',
  ];

  // Estado do Carrossel
  currentIndex = 0;
  private slideInterval: any;

  ngOnInit(): void {
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
