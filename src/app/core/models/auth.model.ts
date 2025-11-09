export interface User {
  id: string;
  nome: string;
  email: string;
  pin: string;
  avatar?: string;
  faceDescriptor?: Float32Array; // Para armazenar dados biométricos
  cargo?: string;
  departamento?: string;
  cargaHorariaDiaria?: number; // Horas esperadas por dia (ex: 8)
  salarioMensal?: number; // Salário mensal para cálculos trabalhistas
  chavePix?: string; // Chave PIX para pagamento (CPF, e-mail, telefone ou aleatória)
  isAdmin?: boolean; // Indica se o usuário tem acesso admin
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  pin: string;
}

export interface FaceAuthResult {
  success: boolean;
  confidence?: number;
  error?: string;
}
