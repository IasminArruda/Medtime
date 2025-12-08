import { Component, ElementRef, HostListener, signal, ViewChild, WritableSignal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { BannerService } from 'src/app/services/banner.service';
import { LogoService } from 'src/app/services/logo.service';
import { FaqService, FaqItem } from 'src/app/services/faq.service';
import { CuriosidadesService, CuriosidadeItem } from 'src/app/services/curiosidades.service';

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

  constructor(public authService: AuthService, private router: Router, private bannerService: BannerService, private logoService: LogoService, public faqService: FaqService, private translate: TranslateService, private curiosidadesService: CuriosidadesService) { }

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
      this.faqService.home$.subscribe((h: FaqItem[]) => this.perguntasHome = h.slice());
      this.faqService.dashboard$.subscribe((d: FaqItem[]) => this.perguntasDash = d.slice());
    } catch (e) { }
    this.loadCuriosidades();
    this.curiosidadesService.curiosidades$.subscribe(list => {
      this.curiosidades = (list || []).slice();
    });
  }
  banners: any[] = [];
  perguntas: any[] = [];
  curiosidades: any[] = [];
  sobreNos: any[] = [];
  privacidades: any[] = [];


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
    { id: 'pesquisa', icon: 'fas fa-search', textKey: 'MENU.SEARCH' },
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

  perguntasHome: FaqItem[] = [];
  perguntasDash: FaqItem[] = [];
  editingPerguntaHomeIndex: number | null = null;
  editingPerguntaDashIndex: number | null = null;
  perguntaTempQ = '';
  perguntaTempA = '';

  openEditPerguntaHome(i: number) {
    this.editingPerguntaHomeIndex = i;
    const it = this.perguntasHome[i] || { q: '', a: '' };
    this.perguntaTempQ = it.q;
    this.perguntaTempA = it.a;
  }

  cancelEditPerguntaHome() {
    this.editingPerguntaHomeIndex = null;
    this.perguntaTempQ = '';
    this.perguntaTempA = '';
  }

  confirmEditPerguntaHome() {
    if (this.editingPerguntaHomeIndex === null) return;
    const item: FaqItem = { q: (this.perguntaTempQ || '').trim(), a: (this.perguntaTempA || '').trim() };
    this.faqService.updateHome(this.editingPerguntaHomeIndex, item);
    this.cancelEditPerguntaHome();
  }

  deletePerguntaHome(i: number) {
    if (!confirm('Confirma exclusão da pergunta da Home?')) return;
    this.faqService.removeHome(i);
  }

  openEditPerguntaDash(i: number) {
    this.editingPerguntaDashIndex = i;
    const it = this.perguntasDash[i] || { q: '', a: '' };
    this.perguntaTempQ = it.q;
    this.perguntaTempA = it.a;
  }

  cancelEditPerguntaDash() {
    this.editingPerguntaDashIndex = null;
    this.perguntaTempQ = '';
    this.perguntaTempA = '';
  }

  confirmEditPerguntaDash() {
    if (this.editingPerguntaDashIndex === null) return;
    const item: FaqItem = { q: (this.perguntaTempQ || '').trim(), a: (this.perguntaTempA || '').trim() };
    this.faqService.updateDash(this.editingPerguntaDashIndex, item);
    this.cancelEditPerguntaDash();
  }

  deletePerguntaDash(i: number) {
    if (!confirm('Confirma exclusão da pergunta do Dashboard?')) return;
    this.faqService.removeDash(i);
  }

  // Curiosidades
  editingCuriosidadeIndex: number | null = null;
  showAddCuriosidade: boolean = false;
  curiosidadeTempTitle = '';
  curiosidadeTempText = '';
  curiosidadeTempImg = '';

  loadCuriosidades() {
  }

  persistCuriosidades() {
    try {
      localStorage.setItem('curiosidades_list', JSON.stringify(this.curiosidades || []));
    } catch (e) { }
  }

  openAddCuriosidade() {
    this.showAddCuriosidade = true;
    this.editingCuriosidadeIndex = null;
    this.curiosidadeTempTitle = '';
    this.curiosidadeTempText = '';
    this.curiosidadeTempImg = '';
  }

  cancelAddCuriosidade() {
    this.showAddCuriosidade = false;
    this.curiosidadeTempTitle = '';
    this.curiosidadeTempText = '';
    this.curiosidadeTempImg = '';
  }

  confirmAddCuriosidade() {
    const title = (this.curiosidadeTempTitle || '').trim();
    const text = (this.curiosidadeTempText || '').trim();
    const img = (this.curiosidadeTempImg || '').trim();
    if (!title && !text) return;
    const item = { id: Date.now().toString(), title, text, img };
    this.curiosidadesService.add(item as CuriosidadeItem);
    console.log('Curiosidade adicionada', item);
    this.cancelAddCuriosidade();
  }

  openEditCuriosidade(i: number) {
    const it = this.curiosidades[i] || { title: '', text: '', img: '' };
    this.editingCuriosidadeIndex = i;
    this.showAddCuriosidade = false;
    this.curiosidadeTempTitle = it.title || '';
    this.curiosidadeTempText = it.text || '';
    this.curiosidadeTempImg = it.img || '';
  }

  cancelEditCuriosidade() {
    this.editingCuriosidadeIndex = null;
    this.curiosidadeTempTitle = '';
    this.curiosidadeTempText = '';
    this.curiosidadeTempImg = '';
  }

  confirmEditCuriosidade() {
    if (this.editingCuriosidadeIndex === null) return;
    const idx = this.editingCuriosidadeIndex;
    const title = (this.curiosidadeTempTitle || '').trim();
    const text = (this.curiosidadeTempText || '').trim();
    const img = (this.curiosidadeTempImg || '').trim();
    const existing = this.curiosidades[idx] || {};
    existing.title = title;
    existing.text = text;
    existing.img = img;
    this.curiosidadesService.update(idx, existing as CuriosidadeItem);
    console.log('Curiosidade editada', idx, existing);
    this.cancelEditCuriosidade();
  }

  deleteCuriosidade(i: number) {
    if (!confirm('Confirma exclusão da curiosidade?')) return;
    this.curiosidadesService.remove(i);
    console.log('Curiosidade excluída', i);
  }

}
