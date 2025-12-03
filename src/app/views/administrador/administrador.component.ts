import { Component, ElementRef, HostListener, signal, ViewChild, WritableSignal } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

export interface AdministradorItems {
  id: string; // Para controle do painel ativo
  icon: string; // Classes do FontAwesome (ex: 'fas fa-home')
  textKey: string; // Chave de tradução (ex: 'MENU.MANAGE_CONTENT')
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
  id: string | undefined; // Para controle do painel ativo
  icon: string | undefined; // Classes do FontAwesome, como 'fas fa-home'
  textKey: string | undefined; // Chave de tradução para o texto principal

  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('menuIcon') menuIcon!: ElementRef;
  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

  constructor(public authService: AuthService, private router: Router) { }

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

}
