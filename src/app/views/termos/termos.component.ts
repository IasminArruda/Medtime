import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { PrivacidadeService, PrivacidadeItem } from 'src/app/services/privacidade.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-termos',
  templateUrl: './termos.component.html',
  styleUrls: ['./termos.component.scss']
})
export class TermosComponent implements OnInit, OnDestroy {
  userMenuAtivo: any;
  menuAtivo: boolean | undefined;
  isLoggedIn = false;
  termsHtml = '';
  policyHtml = '';

  private sub!: Subscription;

  constructor(public authService: AuthService, private router: Router, private privService: PrivacidadeService) { }

  ngOnInit(): void {
    this.sub = this.privService.items$.subscribe(list => {
      const policy = (list && list[0]) || { content: '' } as PrivacidadeItem;
      const terms = (list && list[1]) || { content: '' } as PrivacidadeItem;
      this.policyHtml = policy.content || '';
      this.termsHtml = terms.content || '';
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  editPriv(index: number) {

    try {
      this.router.navigate(['/administrador'], { state: { open: 'privacidade', index } });
    } catch (e) { }
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
}
