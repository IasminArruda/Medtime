import { Component, ElementRef, HostListener, signal, ViewChild, WritableSignal } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { BannerService } from 'src/app/services/banner.service';
import { LogoService } from 'src/app/services/logo.service';

export interface AdministradorItems {
  id: string;
  icon: string;
  textKey: string;
}

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.scss']
})
export class AdministradorComponent {
  menuAtivo = false;
  userMenuAtivo = false;
  temProgramacao = false;
  isAdmin = false;
  id: string | undefined;
  icon: string | undefined;
  textKey: string | undefined;

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

  constructor(public authService: AuthService, private router: Router, private bannerService: BannerService, private logoService: LogoService) { }

  homeBanners: string[] = [];
  dashboardBanners: string[] = [];
  logos: string[] = [];
  newHomeUrl = '';
  newDashUrl = '';

  ngOnInit(): void {
    try {
      this.bannerService.homeBanners$.subscribe((b: string[]) => this.homeBanners = b.slice());
      this.bannerService.dashboardBanners$.subscribe((b: string[]) => this.dashboardBanners = b.slice());
      this.logoService.logos$.subscribe((l: string[]) => this.logos = l.slice());
    } catch (e) {}
  }
  banners = [];
  perguntas = [];
  curiosidades = [];
  sobreNos = [];
  pesquisas = [];


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

  efetuarLogout() {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.userMenuAtivo = false;
  }

  navigateToVerProgramacao() {
    this.router.navigate(['/qrcode'], { state: { verProgramacao: true } });
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

  administradorItems: AdministradorItems[] = [
    { id: 'gerenciar-conteudo', icon: 'fas fa-home', textKey: 'MENU.MANAGE_CONTENT' },
    { id: 'gerenciar-usuario', icon: 'fas fa-user', textKey: 'MENU.MANAGE_USER' },
    { id: 'privacidade', icon: 'fas fa-lock', textKey: 'MENU.PRIVACY' },
    { id: 'gerenciar-alarme', icon: 'fas fa-clock', textKey: 'MENU.MANAGE_ALARM' },
    { id: 'contato', icon: 'fas fa-phone', textKey: 'MENU.CONTACT' },
  ];

  // Exemplo de variável para controlar o painel ativo
  activePanel: WritableSignal<string> = signal('gerenciar-conteudo');

  selectPanel(panelId: string): void {
    this.activePanel.set(panelId);
    // Lógica para carregar o conteúdo do painel
    console.log(`Painel selecionado: ${panelId}`);
  }

  modalAberto: WritableSignal<string | null> = signal(null);
  editingHome: { [key: number]: boolean } = {};
  editHomeValues: { [key: number]: string } = {};
  editingDash: { [key: number]: boolean } = {};
  editDashValues: { [key: number]: string } = {};
  showAddHome = false;
  showAddDash = false;
  addTempUrl = '';
  editingHomeIndex: number | null = null;
  editingDashIndex: number | null = null;
  showAddLogo = false;
  editingLogoIndex: number | null = null;
  openModal(tipo: string) {
    this.modalAberto.set(tipo);
  }

  closeModal() {
    this.modalAberto.set(null);
  }

  addHomeBanner() {
    const url = (this.newHomeUrl || '').trim();
    if (!url) return;
    this.bannerService.addToHome(url);
    this.newHomeUrl = '';
  }

  addDashboardBanner() {
    const url = (this.newDashUrl || '').trim();
    if (!url) return;
    this.bannerService.addToDashboard(url);
    this.newDashUrl = '';
  }

  openAddHome() {
    this.showAddHome = true;
    this.addTempUrl = '';
  }

  openAddLogo() {
    this.showAddLogo = true;
    this.addTempUrl = '';
  }

  cancelAddLogo() {
    this.showAddLogo = false;
    this.addTempUrl = '';
  }

  confirmAddLogo() {
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.logoService.add(url);
    this.cancelAddLogo();
  }

  openEditLogo(i: number) {
    this.editingLogoIndex = i;
    this.addTempUrl = this.logos[i] || '';
  }

  cancelEditLogo() {
    this.editingLogoIndex = null;
    this.addTempUrl = '';
  }

  confirmEditLogo() {
    if (this.editingLogoIndex === null) return;
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.logoService.update(this.editingLogoIndex, url);
    this.cancelEditLogo();
  }

  deleteLogo(i: number) {
    this.logoService.remove(i);
  }

  cancelAddHome() {
    this.showAddHome = false;
    this.addTempUrl = '';
  }

  confirmAddHome() {
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.bannerService.addToHome(url);
    this.cancelAddHome();
  }

  openAddDash() {
    this.showAddDash = true;
    this.addTempUrl = '';
  }

  cancelAddDash() {
    this.showAddDash = false;
    this.addTempUrl = '';
  }

  confirmAddDash() {
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.bannerService.addToDashboard(url);
    this.cancelAddDash();
  }

  openEditHome(i: number) {
    this.editingHomeIndex = i;
    this.addTempUrl = this.homeBanners[i] || '';
  }

  cancelEditHome() {
    this.editingHomeIndex = null;
    this.addTempUrl = '';
  }

  confirmEditHome() {
    if (this.editingHomeIndex === null) return;
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.bannerService.updateHome(this.editingHomeIndex, url);
    this.cancelEditHome();
  }

  openEditDash(i: number) {
    this.editingDashIndex = i;
    this.addTempUrl = this.dashboardBanners[i] || '';
  }

  cancelEditDash() {
    this.editingDashIndex = null;
    this.addTempUrl = '';
  }

  confirmEditDash() {
    if (this.editingDashIndex === null) return;
    const url = (this.addTempUrl || '').trim();
    if (!url) return;
    this.bannerService.updateDashboard(this.editingDashIndex, url);
    this.cancelEditDash();
  }

  deleteHomeBanner(i: number) {
    this.bannerService.removeFromHome(i);
  }

  deleteDashboardBanner(i: number) {
    this.bannerService.removeFromDashboard(i);
  }

  cancelAll() {
    this.cancelAddHome();
    this.cancelAddDash();
    this.cancelAddLogo();
    this.cancelEditHome();
    this.cancelEditDash();
    this.cancelEditLogo();
  }

}
