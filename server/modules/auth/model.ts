import { Elysia, t } from 'elysia';

// Models para Auth
export const AuthModel = new Elysia({ name: 'Model.Auth' })
  .model({
    'auth.loginPin': t.Object({
      pin: t.String(),
    }),
    'auth.loginFace': t.Object({
      userId: t.String(),
      fotoBase64: t.String(),
    }),
    'auth.response': t.Object({
      success: t.Boolean(),
      user: t.Optional(t.Object({
        id: t.String(),
        nome: t.String(),
        email: t.Optional(t.String()),
        isAdmin: t.Boolean(),
        cargaHorariaDiaria: t.Number(),
        salarioMensal: t.Optional(t.Number()),
      })),
      error: t.Optional(t.String()),
    }),
  });
