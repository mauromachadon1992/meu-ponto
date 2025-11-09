import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import * as path from 'path';
import * as fs from 'fs';

// Import controllers
import { configuracoesController } from './modules/configuracoes';
import { authController } from './modules/auth';

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Configurando servidor...');
console.log('📍 CWD:', process.cwd());
console.log('🌐 PORT:', PORT);
console.log('🏭 ENV:', process.env.NODE_ENV);
console.log('🗄️  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não configurada');

const publicPath = path.join(process.cwd(), 'dist/meu-ponto/browser');
const indexHtmlPath = path.join(publicPath, 'index.html');

const app = new Elysia({ name: 'MeuPonto.API' })
  // CORS configurado apenas para desenvolvimento
  .use(
    cors({
      origin: isProduction ? false : true,
      credentials: true,
    })
  )
  
  // Health check
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  }))
  
  // Use controllers
  .use(configuracoesController)
  .use(authController)
  
  // Servir arquivos estáticos e SPA (catch-all deve vir por último)
  .get('*', ({ path: reqPath, request }) => {
    // Ignorar rotas API
    if (reqPath.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }
    
    // Remover query string e hash
    const cleanPath = reqPath.split('?')[0].split('#')[0];
    
    // Tentar servir arquivo estático
    const filePath = path.join(publicPath, cleanPath);
    
    // Verificar se arquivo existe
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const file = Bun.file(filePath);
      // Envolver em Response para evitar bug de HEAD request
      return new Response(request.method === 'HEAD' ? null : file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': file.size.toString(),
        },
      });
    }
    
    // Fallback para index.html (SPA routing)
    const indexFile = Bun.file(indexHtmlPath);
    return new Response(request.method === 'HEAD' ? null : indexFile, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': indexFile.size.toString(),
      },
    });
  })
  
  .listen({
    port: PORT,
    hostname: '0.0.0.0', // Essencial para Docker/Coolify
  });

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  🦊 Meu Ponto - Sistema de Ponto Eletrônico                  ║
║                                                               ║
║  ✅ Servidor rodando em: http://${app.server?.hostname}:${app.server?.port || PORT}                ║
║  🌍 Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}                                 ║
║  ⏰ Timezone: ${process.env.TZ || 'UTC'}                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, encerrando gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recebido, encerrando gracefully...');
  process.exit(0);
});
