import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { prisma } from './lib/prisma';
import {
  setConfiguracoes,
  getConfiguracoes,
  getPercentualHoraExtra,
  calcularHorasNoturnas,
  calcularMinutosAtraso,
  calcularDSR,
  ehDomingo,
  type ConfiguracoesTrabalhistas,
} from './lib/config-helper';
import * as path from 'path';

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const app = new Elysia()
  .use(cors())
  
  // Servir arquivos estáticos do Angular em produção
  .use(
    staticPlugin({
      assets: path.join(process.cwd(), 'dist/meu-ponto/browser'),
      prefix: '/',
      alwaysStatic: true,
      noCache: !isProduction,
    })
  )
  
  // Health check
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  }))
  
  // Configurações Routes
  .group('/api/configuracoes', (app) =>
    app
      .get('/', () => {
        return getConfiguracoes();
      })
      .post(
        '/',
        async ({ body }) => {
          setConfiguracoes(body as ConfiguracoesTrabalhistas);
          return { success: true, configuracoes: getConfiguracoes() };
        },
        {
          body: t.Any(),
        }
      )
  )
  
  // Auth Routes
  .group('/api/auth', (app) =>
    app
      .post(
        '/login-pin',
        async ({ body }) => {
          const { pin } = body;
          
          const user = await prisma.user.findUnique({
            where: { pin },
            select: {
              id: true,
              nome: true,
              email: true,
              avatar: true,
              cargo: true,
              departamento: true,
              cargaHorariaDiaria: true,
              salarioMensal: true,
              isAdmin: true,
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
        },
        {
          body: t.Object({
            pin: t.String({ minLength: 4, maxLength: 4 }),
          }),
        }
      )
      .post(
        '/login-face',
        async ({ body }) => {
          const user = await prisma.user.findFirst({
            select: {
              id: true,
              nome: true,
              email: true,
              avatar: true,
              cargo: true,
              departamento: true,
            },
          });

          if (!user) {
            return {
              success: false,
              error: 'Nenhum usuário encontrado',
            };
          }

          return {
            success: true,
            user,
          };
        }
      )
  )
  
  // Fallback para SPA routing (Angular)
  .get('*', ({ set }) => {
    set.headers['Content-Type'] = 'text/html; charset=utf-8';
    const indexPath = isProduction 
      ? path.join(process.cwd(), 'public', 'index.html')
      : path.join(process.cwd(), 'dist/meu-ponto/browser', 'index.html');
    
    return Bun.file(indexPath);
  })
  
  .listen(PORT);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🦊 Meu Ponto - Sistema de Ponto Eletrônico                  ║
║                                                               ║
║  ✅ Servidor rodando em: http://${app.server?.hostname}:${app.server?.port}                ║
║  🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}                                 ║
║  📊 Database: ${prisma ? 'Conectado' : 'Desconectado'}                              ║
║  ⏰ Timezone: ${process.env.TZ || 'UTC'}                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, encerrando gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recebido, encerrando gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
