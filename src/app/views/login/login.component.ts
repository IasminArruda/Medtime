import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  isRightPanelActive: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  showSignUpPanel(): void {
    this.isRightPanelActive = true;
  }

  showSignInPanel(): void {
    this.isRightPanelActive = false;
  }

  ngOnInit(): void {
    document.body.classList.add('body-login');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('body-login');
  }

  onSubmitLogin(formData: any): void {
    const { email, senha } = formData;

    this.authService.login(email, senha).subscribe({
      next: (role) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro no login:', err);
        alert('Email ou senha inválidos!');
      }
    });
  }

  onSubmitCadastro(formData: any): void {
    this.authService.cadastro(formData).pipe(
      switchMap(() => {
        return this.authService.login(formData.email, formData.senha);
      })
    ).subscribe({
      next: (role) => {
        console.log('Cadastro e login automático com sucesso!', role);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro no cadastro ou login automático:', err);
        const mensagemErro = err.error?.error || 'Erro ao processar sua solicitação.';
        alert(mensagemErro);
      }
    });
  }
}
