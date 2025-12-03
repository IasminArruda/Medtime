export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

export interface CadastroResponse {
  message: string;
  userId: number;
}

export interface LoginResponse {
  message: string;
  token: string;
}
