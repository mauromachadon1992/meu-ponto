import { prisma } from '../../lib/prisma';

// Service para lógica de autenticação
export abstract class AuthService {
  static async loginWithPin(pin: string) {
    const user = await prisma.user.findUnique({
      where: { pin },
      select: {
        id: true,
        nome: true,
        email: true,
        isAdmin: true,
        cargaHorariaDiaria: true,
        salarioMensal: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'PIN inválido',
      };
    }

    return {
      success: true,
      user,
    };
  }

  static async loginWithFace(userId: string, fotoBase64: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        isAdmin: true,
        cargaHorariaDiaria: true,
        salarioMensal: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    // TODO: Implementar validação de reconhecimento facial real
    // Por enquanto, apenas verifica se o usuário existe
    return {
      success: true,
      user,
    };
  }
}
