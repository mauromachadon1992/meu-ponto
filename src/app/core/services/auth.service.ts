import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, delay, throwError, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User, AuthState, LoginCredentials, FaceAuthResult } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;
  
  // Estado da autenticação usando Signals
  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Signals públicos computados
  readonly user = computed(() => this.authState().user);
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly isLoading = computed(() => this.authState().isLoading);
  readonly error = computed(() => this.authState().error);

  // Usuários mock para desenvolvimento
  private mockUsers: User[] = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      pin: '1234',
      cargo: 'Desenvolvedor',
      departamento: 'TI',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
      cargaHorariaDiaria: 8,
      salarioMensal: 5000,
      chavePix: 'joao.silva@empresa.com',
      isAdmin: true, // João é admin
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@empresa.com',
      pin: '5678',
      cargo: 'Gerente de Projetos',
      departamento: 'Gestão',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      cargaHorariaDiaria: 8,
      salarioMensal: 8000,
      chavePix: '+55 11 98765-4321',
      isAdmin: false,
    },
    {
      id: '3',
      nome: 'Pedro Oliveira',
      email: 'pedro.oliveira@empresa.com',
      pin: '9999',
      cargo: 'Designer',
      departamento: 'UX/UI',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
      cargaHorariaDiaria: 6,
      salarioMensal: 4500,
      chavePix: '123.456.789-00',
      isAdmin: false,
    },
  ];

  constructor() {
    this.checkStoredAuth();
  }

  /**
   * Verifica se existe autenticação armazenada
   */
  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.authState.update((state) => ({
          ...state,
          user,
          isAuthenticated: true,
        }));
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Login usando PIN
   */
  loginWithPin(credentials: LoginCredentials): Observable<User> {
    this.authState.update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    return this.http
      .post<{ success: boolean; user?: User; error?: string }>(
        `${this.apiUrl}/auth/login-pin`,
        credentials
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.user) {
            throw new Error(response.error || 'PIN inválido');
          }

          const user = response.user;

          // Armazenar usuário
          localStorage.setItem('currentUser', JSON.stringify(user));

          // Atualizar estado
          this.authState.update((state) => ({
            ...state,
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }));

          return user;
        }),
        catchError((error) => {
          const errorMessage =
            error?.error?.error || error?.message || 'Erro ao fazer login';
          this.authState.update((state) => ({
            ...state,
            isLoading: false,
            error: errorMessage,
          }));
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Autenticação facial usando WebRTC e MediaDevices
   */
  async authenticateWithFace(): Promise<FaceAuthResult> {
    this.authState.update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    try {
      // Verificar suporte do navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera');
      }

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      // Em produção, aqui você implementaria:
      // 1. Captura do frame da câmera
      // 2. Detecção facial (ex: face-api.js ou TensorFlow.js)
      // 3. Comparação com face armazenada
      // 4. Validação de confiança

      // Simulação: após 2 segundos, considera autenticado
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Parar stream
      stream.getTracks().forEach((track) => track.stop());

      // Simular sucesso - em produção, aqui você teria o resultado real
      // Para demo, vamos usar o primeiro usuário
      const user = this.mockUsers[0];
      
      localStorage.setItem('currentUser', JSON.stringify(user));

      this.authState.update((state) => ({
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      return {
        success: true,
        confidence: 0.95, // 95% de confiança
      };
    } catch (error: any) {
      this.authState.update((state) => ({
        ...state,
        isLoading: false,
        error: error.message || 'Erro na autenticação facial',
      }));

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    this.authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    this.router.navigate(['/login']);
  }

  /**
   * Limpar erro
   */
  clearError(): void {
    this.authState.update((state) => ({
      ...state,
      error: null,
    }));
  }

  /**
   * Cadastrar novo usuário
   */
  async cadastrarUsuario(novoUsuario: User): Promise<void> {
    try {
      const response = await from(
        this.http.post<{ success: boolean; user?: User; error?: string }>(
          `${this.apiUrl}/users`,
          novoUsuario
        )
      ).toPromise();

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao cadastrar usuário');
      }

      // Atualizar lista de mock users se necessário (para compatibilidade)
      if (response.user) {
        const index = this.mockUsers.findIndex((u) => u.id === response.user!.id);
        if (index === -1) {
          this.mockUsers.push(response.user);
        } else {
          this.mockUsers[index] = response.user;
        }
        localStorage.setItem('mockUsers', JSON.stringify(this.mockUsers));
      }
    } catch (error: any) {
      throw new Error(error?.error?.error || error?.message || 'Erro ao cadastrar usuário');
    }
  }

  /**
   * Obter usuários da API
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      catchError(() => {
        // Fallback para mock em caso de erro
        return of(this.getMockUsers());
      })
    );
  }

  /**
   * Obter usuários disponíveis (para desenvolvimento/teste)
   */
  getMockUsers(): User[] {
    // Carregar usuários do localStorage se existir
    const storedUsers = localStorage.getItem('mockUsers');
    if (storedUsers) {
      try {
        this.mockUsers = JSON.parse(storedUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários do localStorage:', error);
      }
    }

    // Fallback para mock se API não estiver disponível
    if (!this.mockUsers || this.mockUsers.length === 0) {
      // Tentar buscar da API
      this.http
        .get<User[]>(`${this.apiUrl}/auth/users`)
        .pipe(
          tap((users) => {
            this.mockUsers = users;
          }),
          catchError(() => of([]))
        )
        .subscribe();
    }

    return this.mockUsers.map((u) => ({
      ...u,
      pin: u.pin || '****', // Mostrar PIN para desenvolvimento
    }));
  }
}
