import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UserProfile {
  id?: number | string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
}

const MOCK_USER_ID = 'iasmin-arruda-789';
let mockUserData: UserProfile = {
  userId: MOCK_USER_ID,
  name: 'Iasmin Arruda',
  email: 'iasmin.arruda@aluno.senai.br',
  phone: '(19) 98607-0978',
};

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiBase = 'http://192.168.15.76:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Retorna um Observable com os dados do usuário logado
  getCurrentUserProfile$(): Observable<UserProfile | null> {
    return this.auth.currentUser$.pipe(
      map((u: any) => {
        if (!u) return null;
        return this.mapUsuarioToProfile(u);
      })
    );
  }

  // Retorna os dados do usuário logado de forma síncrona
  getCurrentUserProfile(): UserProfile | null {
    const u: any = this.auth.getUsuario?.() || null;
    return u ? this.mapUsuarioToProfile(u) : null;
  }

  fetchProfileFromServer(userIdOrId?: string | number): Observable<UserProfile> {
    const user = this.auth.getUsuario?.();
    const idToUse = userIdOrId ?? user?.id ?? user?.email ?? MOCK_USER_ID;
    const url = `${this.apiBase}/users/${idToUse}`;
    return this.http.get<any>(url).pipe(
      map(res => this.mapUsuarioToProfile(res)),
      catchError(() => {
        return of({...mockUserData});
      })
    );
  }

  // Atualiza perfil no servidor
  updateProfileOnServer(updates: Partial<UserProfile>): Observable<UserProfile> {
    const user = this.auth.getUsuario?.();
    const idToUse = user?.id ?? MOCK_USER_ID;
    const url = `${this.apiBase}/users/${idToUse}`;
    const payload: any = {};
    if (updates.name !== undefined) payload.nome = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;

    return this.http.patch<any>(url, payload).pipe(
      tap(res => {
        try {
          this.auth.setUsuario(res);
        } catch (e) {
        }
      }),
      map(res => this.mapUsuarioToProfile(res)),
      catchError(() => {
        mockUserData = { ...mockUserData, ...updates } as UserProfile;
        try {
          const fallbackUser: any = { ...mockUserData };
          this.auth.setUsuario(fallbackUser);
        } catch (e) {}
        return of({...mockUserData});
      })
    );
  }

  // Remove conta no servidor
  deleteAccountOnServer(): Observable<void> {
    const user = this.auth.getUsuario?.();
    const idToUse = user?.id ?? MOCK_USER_ID;
    const url = `${this.apiBase}/users/${idToUse}`;
    return this.http.delete<void>(url).pipe(
      catchError(() => {
        mockUserData = { userId: '', name: '', email: '', phone: '' };
        return of(void 0);
      })
    );
  }

  private mapUsuarioToProfile(u: any): UserProfile {
    if (!u) return null as any;
    return {
      id: u.id ?? u.userId ?? undefined,
      userId: u.id ?? (u.email ? String(u.email) : undefined),
      name: u.nome ?? u.fullName ?? u.name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? u.telefone ?? ''
    } as UserProfile;
  }
}
