import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/config.service';

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
  showPhonePrompt = false;
  dddList: string[] = [
    '11','12','13','14','15','16','17','18','19',
    '21','22','24','27','28',
    '31','32','33','34','35','37','38',
    '41','42','43','44','45','46',
    '51','53','54','55',
    '61','62','63','64','65','66','67',
    '68','69','71','73','74','75','77','79',
    '81','82','83','84','85','86','87','88','89',
    '91','92','93','94','95','96','97','98','99'
  ];
  selectedDDD = '';
  phoneNumber = '';

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

  constructor(public authService: AuthService, private router: Router, private translate: TranslateService, private configService: ConfigService) {}

  ngOnInit(): void {
    this.temProgramacao = this.verificarProgramacao();
    // Detectar idioma inicial
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

      try {
        const shouldShow = localStorage.getItem('medtime_show_phone_prompt') === 'true';
        const userPhone = (user as any)?.phone || (user as any)?.telefone || '';
        if (shouldShow && this.isLoggedIn && !userPhone) {
          this.showPhonePrompt = true;
        }
      } catch (e) { }
      // Recompute whether the current user has scheduled programs
      try {
        this.temProgramacao = this.verificarProgramacao();
      } catch (e) { }
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
      if (!Array.isArray(lista) || lista.length === 0) return false;
      const user = this.authService.getUsuario() as any;
      if (user && (user.id || user._id || user.ID)) {
        const userId = String(user.id || user._id || user.ID);
        const filtered = lista.filter((a: any) => String(a.userId || a.UserId || a.user || '') === userId);
        return filtered.length > 0;
      }
      return lista.length > 0;
    } catch {
      return false;
    }
  }

  async savePhoneForNotifications(): Promise<void> {
    const ddd = (this.selectedDDD || '').trim();
    const phone = (this.phoneNumber || '').replace(/\D/g, '');
    if (!ddd) { window.alert('Por favor selecione o DDD da sua cidade.'); return; }
    if (!/^[0-9]{8,9}$/.test(phone)) { window.alert('Informe um número válido com 8 ou 9 dígitos (sem DDD).'); return; }

    const formatted = `+55${ddd}${phone}`;

    try {
      await firstValueFrom(this.configService.updateProfileOnServer({ phone: formatted }));
      this.showPhonePrompt = false;
      try { localStorage.removeItem('medtime_show_phone_prompt'); } catch (e) {}
      window.alert('Telefone salvo! Você começará a receber notificações quando tiver programações.');
    } catch (e) {
      console.error('Erro ao salvar telefone:', e);
      window.alert('Erro ao salvar telefone. Tente novamente.');
    }
  }

  skipPhonePrompt(): void {
    this.showPhonePrompt = false;
    try { localStorage.removeItem('medtime_show_phone_prompt'); } catch (e) {}
  }
}
