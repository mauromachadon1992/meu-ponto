import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  cargo: string;
  departamento: string;
  cargaHorariaDiaria: number;
  salarioMensal: number;
  chavePix: string | null;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PerfilService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  async obterPerfil(userId: string): Promise<UserProfile> {
    return firstValueFrom(this.http.get<UserProfile>(`${this.apiUrl}/${userId}`));
  }

  async atualizarPerfil(userId: string, dados: Partial<UserProfile>): Promise<UserProfile> {
    return firstValueFrom(
      this.http.patch<UserProfile>(`${this.apiUrl}/${userId}`, dados)
    );
  }
}
