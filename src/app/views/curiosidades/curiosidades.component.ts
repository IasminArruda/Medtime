import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-curiosidades',
  templateUrl: './curiosidades.component.html',
  styleUrls: ['./curiosidades.component.scss']
})
export class CuriosidadesComponent implements OnInit, OnDestroy {
  userMenuAtivo = false;
  isLoggedIn = false;

  @ViewChild('userMenu') userMenuElement!: ElementRef;
  @ViewChild('userIcon') userIconElement!: ElementRef;

   constructor(
    private router: Router,
    public authService: AuthService,
    private translate: TranslateService
   ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  ngOnDestroy(): void {
  }

    toggleUserMenu(): void {
      this.userMenuAtivo = !this.userMenuAtivo;
    }

    handleUserClick(): void {
      if (this.isLoggedIn) {
        this.toggleUserMenu();
      } else {
        this.router.navigate(['/login']);
      }
    }

    @HostListener('document:click', ['$event'])
    clickFora(event: MouseEvent): void {
      const target = event.target as HTMLElement;
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

    irParaLogin(): void {
      this.router.navigate(['/login']);
    }

    Voltar(): void {
      this.router.navigate(['/home']);
    }

    irParaSobreNos(): void {
    this.router.navigate(['/sobre']);
  }

  voltar() {
  if (this.authService.isLoggedIn()) {
    this.router.navigate(['/dashboard']);
  } else {
    this.router.navigate(['/home']);
  }
}

  efetuarLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.userMenuAtivo = false;
  }
}
