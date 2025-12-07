import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Usuario {
role: any;
fullName: any;
name: any;
  id: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://192.168.15.76:3000/api/users';

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarUsuarioSalvo();
  }

  private carregarUsuarioSalvo() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);

        if (user && user.id) {
          this.currentUserSubject.next(user);
        } else {
            this.logout();
        }
      } catch (e) {
        console.error('Erro ao carregar usuário salvo, limpando dados.', e);
        this.logout();
      }
    }
  }

  login(email: string, senha: string): Observable<'admin' | 'user'> {
  return this.http.post<Usuario>(`${this.apiUrl}/login`, { email, senha }).pipe(

    tap(usuario => {
      localStorage.setItem('currentUser', JSON.stringify(usuario));
      localStorage.setItem('userRole', usuario.perfil);

      this.currentUserSubject.next(usuario);
    }),

    map(usuario => usuario.perfil)
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    this.currentUserSubject.next(null);
  }

  cadastro(formData: any): Observable<any> {
    const { nome, email, senha } = formData;
    return this.http.post(`${this.apiUrl}/cadastro`, { nome, email, senha });
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getUsuario(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.perfil ?? null;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // Atualiza o usuário atual em memória e no localStorage
  setUsuario(user: Usuario | null): void {
    if (!user) {
      this.logout();
      return;
    }
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userRole', user.perfil);
    } catch (e) {
      console.warn('Falha ao salvar usuário no localStorage', e);
    }
    this.currentUserSubject.next(user);
  }
}
