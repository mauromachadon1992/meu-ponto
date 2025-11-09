import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroPonto } from '../models/registro-ponto.model';

export interface RegistroPontoRequest {
  data: string;
  horario?: string;
  tipoHorario?: string;
  entrada?: string;
  saidaAlmoco?: string;
  retornoAlmoco?: string;
  saida?: string;
  observacao?: string;
  tipo?: string;
  status?: string;
  userId: string;
  periodoId?: string;
  fotoBase64?: string;
  localizacao?: {
    latitude: number;
    longitude: number;
    precisao: number;
  };
}

export interface RegistroPontoResponse extends RegistroPonto {
  user: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RegistroPontoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/registros';

  registrarPonto(dados: RegistroPontoRequest): Observable<RegistroPontoResponse> {
    return this.http.post<RegistroPontoResponse>(this.apiUrl, dados);
  }

  obterRegistrosHoje(userId: string): Observable<RegistroPontoResponse[]> {
    return this.http.get<RegistroPontoResponse[]>(`${this.apiUrl}/hoje/${userId}`);
  }
}
