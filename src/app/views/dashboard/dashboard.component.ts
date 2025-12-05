import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit, OnDestroy {
  temProgramacao = false;
  private readonly STORAGE_KEY = 'medtime_alarmes_agendados';
  menuAtivo = false;
  userMenuAtivo = false;
  isLoggedIn = false;
  userName = '';
  isAdmin = false;
  currentLanguage = 'pt-BR';

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

  // Estado do Carrossel
  currentIndex = 0;
  private slideInterval: any;
  private destroy$ = new Subject<void>();

  images = [
    'assets/img/carrossel2/1.svg',
    'assets/img/carrossel2/2.svg',
    'assets/img/carrossel2/3.svg',
    'assets/img/carrossel2/4.svg',
    'assets/img/carrossel2/5.svg',
  ];

  constructor(public authService: AuthService, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.temProgramacao = this.verificarProgramacao();
    // Detecta idioma inicial
    this.currentLanguage = this.translate.currentLang || 'pt-BR';
    this.updateCarouselImages();

    // Observa mudanças de idioma
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.currentLanguage = event.lang;
        this.updateCarouselImages();
      });

    this.authService.currentUser$.subscribe((user) => {

      this.isLoggedIn = !!user;
      this.userName = (user?.nome || user?.name) || '';

      if (this.isLoggedIn && user) {
        this.isAdmin = user.perfil === 'admin';
      } else {
        this.isAdmin = false;
        this.userName = '';
      }

      console.log('Status do Usuário (Dashboard):', {
          isLogged: this.isLoggedIn,
          isAdministrator: this.isAdmin,
          Name: this.userName
      });
    });

    // Inicializa o carrossel
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateCarouselImages(): void {
    const languageMap: { [key: string]: string } = {
      'pt-BR': 'carrossel2',
      'en-US': 'carrossel2-en',
      'es': 'carrossel2-es',
      'fr': 'carrossel2-fr'
    };

    const folder = languageMap[this.currentLanguage] || 'carrossel2';

    this.images = [
      `assets/img/${folder}/1.svg`,
      `assets/img/${folder}/2.svg`,
      `assets/img/${folder}/3.svg`,
      `assets/img/${folder}/4.svg`,
      `assets/img/${folder}/5.svg`,
    ];

    // Reseta o índice do carrossel
    this.currentIndex = 0;
  }

  toggleMenu() {
    this.menuAtivo = !this.menuAtivo;
    if (this.menuAtivo) {
        this.userMenuAtivo = false;
    }
  }

  toggleUserMenu() {
    this.userMenuAtivo = !this.userMenuAtivo;
    if (this.userMenuAtivo) {
      this.menuAtivo = false;
    }
  }

  fecharQualquerMenu() {
    this.menuAtivo = false;
    this.userMenuAtivo = false;
  }

  @HostListener('document:click', ['$event'])
  clickFora(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (
      this.menuAtivo &&
      this.menuElement &&
      this.menuIcon &&
      !this.menuElement.nativeElement.contains(target) &&
      !this.menuIcon.nativeElement.contains(target)
    ) {
      this.menuAtivo = false;
    }

    if (this.userMenuAtivo) {
        if (
            this.userMenuElement &&
            this.userIconElement &&
            !this.userMenuElement.nativeElement.contains(target) &&
            !this.userIconElement.nativeElement.contains(target)
        ) {
            this.userMenuAtivo = false;
        }
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

  efetuarLogout() {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.userMenuAtivo = false;
  }

  navigateToVerProgramacao() {
    // Navega para a rota /qrcode informando que queremos ver as programações
    this.router.navigate(['/qrcode'], { state: { verProgramacao: true } });
  }

  verificarProgramacao(): boolean {
    try {
      const alarmes = localStorage.getItem(this.STORAGE_KEY);
      if (!alarmes) { return false; }
      const lista = JSON.parse(alarmes);
      return Array.isArray(lista) && lista.length > 0;
    } catch {
      return false;
    }
  }
}
