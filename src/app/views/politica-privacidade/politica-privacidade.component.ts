import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { PrivacidadeService, PrivacidadeItem } from 'src/app/services/privacidade.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-politica-privacidade',
  templateUrl: './politica-privacidade.component.html',
  styleUrls: ['./politica-privacidade.component.scss']
})
export class PoliticaPrivacidadeComponent implements OnInit, OnDestroy {
  userMenuAtivo: any;
  menuAtivo: boolean | undefined;
  isLoggedIn = false;
  policyHtml = '';

  private sub!: Subscription;

  constructor(public authService: AuthService, private router: Router, private privService: PrivacidadeService) { }

  ngOnInit(): void {
    this.sub = this.privService.items$.subscribe(list => {
      const policy = (list && list[0]) || { content: '' } as PrivacidadeItem;
      this.policyHtml = policy.content || '';
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
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
