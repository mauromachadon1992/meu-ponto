import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from './lib/prisma';

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
  // CORS configurado para permitir proxy reverso em produção
  .use(
    cors({
      origin: true, // Permite todas as origens (proxy do Coolify)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  )
  
  // Middleware para tratar X-Forwarded-* headers do proxy
  .onRequest(({ request }) => {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedHost = request.headers.get('x-forwarded-host');
    
    if (isProduction && forwardedProto && forwardedHost) {
      console.log(`🔄 Proxy request: ${forwardedProto}://${forwardedHost}${new URL(request.url).pathname}`);
    }
  })
  
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
  
  // === REGISTROS DE PONTO ===
  .group('/api/registros', (app) =>
    app
      .get('/hoje/:userId', async ({ params }: any) => {
        const { userId } = params;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        
        const registros = await prisma.registroPonto.findMany({
          where: {
            userId,
            data: {
              gte: hoje,
              lt: amanha,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
              },
            },
          },
        });
        
        return registros;
      })
      .post('/', async ({ body }: any) => {
        const { userId, data, horario, tipoHorario, fotoBase64, localizacao, tipo, entrada, saidaAlmoco, retornoAlmoco, saida, observacao, status, periodoId } = body;
        
        // ===== CRIAR PERÍODO AUTOMATICAMENTE SE NÃO EXISTIR =====
        let periodoIdFinal = periodoId;
        
        if (!periodoIdFinal) {
          const dataRegistro = new Date(data);
          const mesAtual = dataRegistro.getMonth();
          const anoAtual = dataRegistro.getFullYear();
          
          // Calcular data de início e fim do mês
          const dataInicio = new Date(anoAtual, mesAtual, 1);
          const dataFim = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);
          
          // Verificar se já existe um período para este mês/usuário
          const periodoExistente = await prisma.periodoFechamento.findFirst({
            where: {
              userId,
              dataInicio: {
                gte: dataInicio,
                lt: new Date(anoAtual, mesAtual, 2), // Primeiro dia + 1 (tolerância)
              },
            },
          });
          
          if (periodoExistente) {
            periodoIdFinal = periodoExistente.id;
            console.log(`✅ Período existente encontrado: ${periodoExistente.id}`);
          } else {
            // Criar novo período de fechamento
            const novoPeriodo = await prisma.periodoFechamento.create({
              data: {
                userId,
                dataInicio,
                dataFim,
                status: 'ABERTO',
                totalHorasTrabalhadas: 0,
                totalHorasExtras: 0,
                totalHorasDevidas: 0,
                cargaHorariaMensal: 176,
              },
            });
            
            periodoIdFinal = novoPeriodo.id;
            console.log(`✅ Novo período criado automaticamente: ${novoPeriodo.id} (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`);
          }
        }
        // ===== FIM DA CRIAÇÃO AUTOMÁTICA DE PERÍODO =====
        
        const registro = await prisma.registroPonto.create({
          data: {
            userId,
            data: new Date(data),
            horario: horario || null,
            tipoHorario: tipoHorario || null,
            entrada: entrada || null,
            saidaAlmoco: saidaAlmoco || null,
            retornoAlmoco: retornoAlmoco || null,
            saida: saida || null,
            observacao: observacao || null,
            fotoUrl: fotoBase64 || null,
            localizacao: localizacao ? JSON.stringify(localizacao) : null,
            tipo: tipo || 'NORMAL',
            status: status || 'COMPLETO',
            periodoId: periodoIdFinal, // Usar período criado automaticamente
          },
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
              },
            },
          },
        });
        
        return registro;
      })
      .patch('/:id', async ({ params, body }: any) => {
        const { id } = params;
        const updateData: any = {};
        
        if (body.entrada !== undefined) updateData.entrada = body.entrada || null;
        if (body.saidaAlmoco !== undefined) updateData.saidaAlmoco = body.saidaAlmoco || null;
        if (body.retornoAlmoco !== undefined) updateData.retornoAlmoco = body.retornoAlmoco || null;
        if (body.saida !== undefined) updateData.saida = body.saida || null;
        if (body.observacao !== undefined) updateData.observacao = body.observacao || null;
        if (body.tipo !== undefined) updateData.tipo = body.tipo;
        if (body.status !== undefined) updateData.status = body.status;
        
        const registro = await prisma.registroPonto.update({
          where: { id },
          data: updateData,
        });
        
        return registro;
      })
      .delete('/:id', async ({ params }: any) => {
        const { id } = params;
        await prisma.registroPonto.delete({
          where: { id },
        });
        return { success: true };
      })
  )
  
  // === USUÁRIOS ===
  .group('/api/users', (app) =>
    app
      .get('/', async () => {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            pin: true,
            cargo: true,
            departamento: true,
            cargaHorariaDiaria: true,
            salarioMensal: true,
            chavePix: true,
            isAdmin: true,
            avatar: true,
          },
        });
        return users;
      })
      .post('/', async ({ body }: any) => {
        // Verificar PIN duplicado
        const pinExistente = await prisma.user.findUnique({
          where: { pin: body.pin },
        });
        
        if (pinExistente) {
          return {
            success: false,
            error: 'PIN já cadastrado. Escolha outro PIN.',
          };
        }
        
        // Verificar email duplicado
        const emailExistente = await prisma.user.findUnique({
          where: { email: body.email },
        });
        
        if (emailExistente) {
          return {
            success: false,
            error: 'E-mail já cadastrado.',
          };
        }
        
        // Criar usuário
        const novoUsuario = await prisma.user.create({
          data: {
            nome: body.nome,
            email: body.email,
            pin: body.pin,
            avatar: body.avatar || null,
            cargo: body.cargo,
            departamento: body.departamento,
            cargaHorariaDiaria: body.cargaHorariaDiaria,
            salarioMensal: body.salarioMensal,
            chavePix: body.chavePix || null,
            isAdmin: body.isAdmin || false,
          },
        });
        
        return {
          success: true,
          user: novoUsuario,
        };
      })
      .get('/:id', async ({ params }: any) => {
        const { id } = params;
        
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            nome: true,
            email: true,
            avatar: true,
            cargo: true,
            departamento: true,
            cargaHorariaDiaria: true,
            salarioMensal: true,
            chavePix: true,
            isAdmin: true,
          },
        });
        
        if (!user) {
          throw new Error('Usuário não encontrado');
        }
        
        return user;
      })
  )
  
  // === PERÍODOS DE FECHAMENTO ===
  .group('/api/periodos', (app) =>
    app
      .get('/', async ({ query }: any) => {
        const { userId } = query || {};
        
        const periodos = await prisma.periodoFechamento.findMany({
          where: userId ? { userId } : {},
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            _count: {
              select: {
                registros: true,
              },
            },
          },
          orderBy: {
            dataInicio: 'desc',
          },
        });
        
        return periodos;
      })
      .post('/', async ({ body }: any) => {
        const { userId, mes, ano } = body;
        
        // Validar entrada
        if (!userId || !mes || !ano) {
          throw new Error('userId, mes e ano são obrigatórios');
        }
        
        if (mes < 1 || mes > 12) {
          throw new Error('Mês inválido (1-12)');
        }
        
        if (ano < 2020 || ano > 2100) {
          throw new Error('Ano inválido');
        }
        
        // Calcular data de início e fim do mês
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0, 23, 59, 59);
        
        // Verificar se já existe um período para este mês/usuário
        const periodoExistente = await prisma.periodoFechamento.findFirst({
          where: {
            userId,
            dataInicio: {
              gte: dataInicio,
              lt: new Date(ano, mes - 1, 2), // Primeiro dia + 1 (tolerância)
            },
          },
        });
        
        if (periodoExistente) {
          throw new Error('Já existe um período de fechamento para este mês e usuário');
        }
        
        // Criar novo período
        const novoPeriodo = await prisma.periodoFechamento.create({
          data: {
            userId,
            dataInicio,
            dataFim,
            status: 'ABERTO',
            totalHorasTrabalhadas: 0,
            totalHorasExtras: 0,
            totalHorasDevidas: 0,
            cargaHorariaMensal: 176,
          },
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            _count: {
              select: {
                registros: true,
              },
            },
          },
        });
        
        console.log(`✅ Período criado manualmente por admin: ${novoPeriodo.id} (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`);
        
        return novoPeriodo;
      })
      .get('/:id', async ({ params }: any) => {
        const { id } = params;
        
        const periodo = await prisma.periodoFechamento.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            registros: {
              orderBy: {
                data: 'asc',
              },
            },
          },
        });
        
        if (!periodo) {
          throw new Error('Período não encontrado');
        }
        
        return periodo;
      })
      .get('/:id/registros', async ({ params }: any) => {
        const { id } = params;
        
        const registros = await prisma.registroPonto.findMany({
          where: { periodoId: id },
          orderBy: [
            { data: 'asc' },
            { createdAt: 'asc' },
          ],
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
              },
            },
          },
        });
        
        return registros;
      })
      .get('/:id/resumo', async ({ params }: any) => {
        const { id } = params;
        
        const periodo = await prisma.periodoFechamento.findUnique({
          where: { id },
          include: {
            registros: true,
            user: true,
          },
        });
        
        if (!periodo) {
          throw new Error('Período não encontrado');
        }
        
        // Cálculos básicos de resumo
        const registrosPorDia = new Map<string, any[]>();
        periodo.registros.forEach(registro => {
          const dataKey = new Date(registro.data).toISOString().split('T')[0];
          if (!registrosPorDia.has(dataKey)) {
            registrosPorDia.set(dataKey, []);
          }
          registrosPorDia.get(dataKey)!.push(registro);
        });
        
        let totalHorasTrabalhadas = 0;
        let diasTrabalhados = 0;
        
        registrosPorDia.forEach((registrosDia) => {
          const registrosOrdenados = registrosDia
            .filter(r => r.horario && r.tipo === 'NORMAL')
            .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
          
          if (registrosOrdenados.length >= 2) {
            const primeiro = registrosOrdenados[0].horario!;
            const ultimo = registrosOrdenados[registrosOrdenados.length - 1].horario!;
            
            const [h1, m1] = primeiro.split(':').map(Number);
            const [h2, m2] = ultimo.split(':').map(Number);
            
            let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
            
            // Descontar intervalo de almoço se houver
            const saidaAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'SAIDA_ALMOCO');
            const retornoAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'RETORNO_ALMOCO');
            
            if (saidaAlmoco?.horario && retornoAlmoco?.horario) {
              const [h3, m3] = saidaAlmoco.horario.split(':').map(Number);
              const [h4, m4] = retornoAlmoco.horario.split(':').map(Number);
              const intervalo = (h4 * 60 + m4) - (h3 * 60 + m3);
              if (intervalo > 0) totalMinutos -= intervalo;
            }
            
            const horasDia = totalMinutos / 60;
            totalHorasTrabalhadas += horasDia;
            diasTrabalhados++;
          }
        });
        
        const cargaHorariaDiaria = periodo.user?.cargaHorariaDiaria || 8;
        const horasEsperadas = diasTrabalhados * cargaHorariaDiaria;
        const totalHorasExtras = Math.max(0, totalHorasTrabalhadas - horasEsperadas);
        const totalHorasDevidas = Math.max(0, horasEsperadas - totalHorasTrabalhadas);
        
        // Atualizar período
        await prisma.periodoFechamento.update({
          where: { id },
          data: {
            totalHorasTrabalhadas,
            totalHorasExtras,
            totalHorasDevidas,
          },
        });
        
        return {
          diasTrabalhados,
          diasFaltados: 0,
          diasFeriados: 0,
          horasMedias: diasTrabalhados > 0 ? totalHorasTrabalhadas / diasTrabalhados : 0,
          totalHorasTrabalhadas,
          totalHorasExtras,
          totalHorasDevidas,
        };
      })
  )
  
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
    reusePort: true, // Melhor performance e reload
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
