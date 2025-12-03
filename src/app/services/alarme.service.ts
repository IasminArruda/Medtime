import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlarmePayload {
  nome?: string;
  dose?: string;
  horaI?: string;
  intervalo?: string;
  duracao?: string | number;
  userId?: number | string;
}

@Injectable({ providedIn: 'root' })
export class AlarmeService {
  private base = 'http://localhost:3000/api/alarmes';
  constructor(private http: HttpClient) {}

  createAlarme(payload: AlarmePayload): Observable<any> {
    return this.http.post(this.base, payload);
  }

  getAlarmesByUser(userId: string | number): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}`);
  }

  updateAlarme(id: string | number, payload: AlarmePayload): Observable<any> {
    return this.http.patch(`${this.base}/${id}`, payload);
  }

  deleteAlarme(id: string | number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
