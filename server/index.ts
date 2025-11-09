import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
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

const app = new Elysia()
  .use(cors())
  .get('/', () => ({ message: 'Meu Ponto API' }))
  
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
          body: t.Any(), // Aceita qualquer objeto
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
          // Simulação - em produção, aqui você processaria dados biométricos
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
            confidence: 0.95,
          };
        }
      )
  )
  
  // Users Routes
  .group('/api/users', (app) =>
    app
      .get('/', async () => {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            pin: true,
            avatar: true,
            cargo: true,
            departamento: true,
            cargaHorariaDiaria: true,
            salarioMensal: true,
            chavePix: true,
            isAdmin: true,
          },
        });

        return users;
      })
      .post(
        '/',
        async ({ body }) => {
          // Verificar se PIN já existe
          const pinExistente = await prisma.user.findUnique({
            where: { pin: body.pin },
          });

          if (pinExistente) {
            return {
              success: false,
              error: 'PIN já cadastrado. Escolha outro PIN.',
            };
          }

          // Verificar se email já existe
          const emailExistente = await prisma.user.findUnique({
            where: { email: body.email },
          });

          if (emailExistente) {
            return {
              success: false,
              error: 'E-mail já cadastrado.',
            };
          }

          // Criar novo usuário
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
            select: {
              id: true,
              nome: true,
              email: true,
              pin: true,
              avatar: true,
              cargo: true,
              departamento: true,
              cargaHorariaDiaria: true,
              salarioMensal: true,
              chavePix: true,
              isAdmin: true,
            },
          });

          return {
            success: true,
            user: novoUsuario,
          };
        },
        {
          body: t.Object({
            nome: t.String({ minLength: 3 }),
            email: t.String({ format: 'email' }),
            pin: t.String({ minLength: 4, maxLength: 4 }),
            avatar: t.Optional(t.String()),
            cargo: t.String({ minLength: 2 }),
            departamento: t.String({ minLength: 2 }),
            cargaHorariaDiaria: t.Number({ minimum: 4, maximum: 12 }),
            salarioMensal: t.Number({ minimum: 1320 }),
            chavePix: t.Optional(t.String()),
            isAdmin: t.Optional(t.Boolean()),
          }),
        }
      )
      .get(
        '/:id',
        async ({ params }) => {
          const user = await prisma.user.findUnique({
            where: { id: params.id },
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
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
  )

  // Periodos Routes
  .group('/api/periodos', (app) =>
    app
      .get('/', async ({ query }) => {
        const { userId } = query;
        
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
      .get(
        '/:id',
        async ({ params }) => {
          const periodo = await prisma.periodoFechamento.findUnique({
            where: { id: params.id },
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
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      .get(
        '/:id/registros',
        async ({ params }) => {
          const registros = await prisma.registroPonto.findMany({
            where: { periodoId: params.id },
            orderBy: {
              data: 'asc',
            },
          });

          return registros;
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      .get(
        '/:id/resumo',
        async ({ params }) => {
          const periodo = await prisma.periodoFechamento.findUnique({
            where: { id: params.id },
            include: {
              registros: true,
              user: true,
            },
          });

          if (!periodo) {
            throw new Error('Período não encontrado');
          }

          // Função auxiliar para contar dias úteis entre duas datas
          const contarDiasUteis = (inicio: Date, fim: Date): number => {
            let count = 0;
            const current = new Date(inicio);
            while (current <= fim) {
              const diaSemana = current.getDay();
              // Não conta sábado (6) e domingo (0)
              if (diaSemana !== 0 && diaSemana !== 6) {
                count++;
              }
              current.setDate(current.getDate() + 1);
            }
            return count;
          };

          // Agrupar registros por dia
          const registrosPorDia = new Map<string, any[]>();
          periodo.registros.forEach(registro => {
            const dataKey = new Date(registro.data).toISOString().split('T')[0];
            if (!registrosPorDia.has(dataKey)) {
              registrosPorDia.set(dataKey, []);
            }
            registrosPorDia.get(dataKey)!.push(registro);
          });

          // Calcular horas trabalhadas por dia e contar tipos de dias
          let totalHorasTrabalhadas = 0;
          let totalHorasNoturnas = 0;
          let totalMinutosAtraso = 0;
          let diasTrabalhados = 0;
          let diasFeriados = 0;
          let diasComHorasExtrasEmDomingo = 0;
          
          registrosPorDia.forEach((registrosDia, dataKey) => {
            // Verificar tipo de dia
            const tiposDia = registrosDia.map(r => r.tipo);
            const dataDia = new Date(dataKey);
            
            if (tiposDia.includes('FERIADO')) {
              diasFeriados++;
              return; // Não conta horas em feriados
            }
            
            if (tiposDia.includes('FERIAS')) {
              return; // Não conta horas em férias
            }
            
            if (tiposDia.includes('ATESTADO')) {
              return; // Não conta horas em atestados
            }
            
            // Filtrar apenas registros normais com horário
            const registrosOrdenados = registrosDia
              .filter(r => r.horario && r.tipo === 'NORMAL')
              .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));
            
            if (registrosOrdenados.length >= 2) {
              // Validar ordem dos registros
              let ordemValida = true;
              for (let i = 0; i < registrosOrdenados.length - 1; i++) {
                if (registrosOrdenados[i].horario! >= registrosOrdenados[i + 1].horario!) {
                  ordemValida = false;
                  console.warn(`⚠️ Registros fora de ordem detectados no dia ${new Date(registrosOrdenados[i].data).toLocaleDateString()}`);
                }
              }
              
              const primeiro = registrosOrdenados[0].horario!;
              const ultimo = registrosOrdenados[registrosOrdenados.length - 1].horario!;
              
              const [h1, m1] = primeiro.split(':').map(Number);
              const [h2, m2] = ultimo.split(':').map(Number);
              
              let totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
              
              // Validar se o horário de saída é posterior à entrada
              if (totalMinutos < 0) {
                console.warn(`⚠️ Horário de saída anterior à entrada detectado no dia ${new Date(registrosOrdenados[0].data).toLocaleDateString()}`);
                totalMinutos = 0;
              }
              
              // Descontar intervalo de almoço
              const saidaAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'SAIDA_ALMOCO');
              const retornoAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'RETORNO_ALMOCO');
              
              if (saidaAlmoco?.horario && retornoAlmoco?.horario) {
                const [h3, m3] = saidaAlmoco.horario.split(':').map(Number);
                const [h4, m4] = retornoAlmoco.horario.split(':').map(Number);
                const intervalo = (h4 * 60 + m4) - (h3 * 60 + m3);
                
                // Validar se o retorno é posterior à saída
                if (intervalo > 0) {
                  totalMinutos -= intervalo;
                } else {
                  console.warn(`⚠️ Horário de retorno do almoço anterior à saída detectado`);
                }
              }
              
              const horasDia = totalMinutos / 60;
              totalHorasTrabalhadas += horasDia;
              diasTrabalhados++;
              
              // Calcular horas noturnas (22h-5h)
              const horasNoturnasDia = calcularHorasNoturnas(primeiro, ultimo);
              totalHorasNoturnas += horasNoturnasDia;
              
              // Calcular atraso (assumindo entrada esperada às 08:00)
              const horarioEsperadoEntrada = '08:00';
              const minutosAtraso = calcularMinutosAtraso(horarioEsperadoEntrada, primeiro);
              totalMinutosAtraso += minutosAtraso;
              
              // Verificar se trabalhou em domingo
              if (ehDomingo(dataDia)) {
                diasComHorasExtrasEmDomingo++;
              }
            }
          });

          // Calcular dias esperados (dias úteis no período)
          const diasUteisEsperados = contarDiasUteis(periodo.dataInicio, periodo.dataFim);
          const diasFaltados = Math.max(0, diasUteisEsperados - diasTrabalhados - diasFeriados);
          
          const cargaHorariaDiaria = periodo.user?.cargaHorariaDiaria || 8;
          const horasEsperadas = diasTrabalhados * cargaHorariaDiaria;
          const totalHorasExtras = Math.max(0, totalHorasTrabalhadas - horasEsperadas);
          const totalHorasDevidas = Math.max(0, horasEsperadas - totalHorasTrabalhadas);
          
          // Obter configurações
          const config = getConfiguracoes();
          
          // Calcular percentual de hora extra (considerando domingos)
          const percentualHE = diasComHorasExtrasEmDomingo > 0 
            ? getPercentualHoraExtra(true) 
            : getPercentualHoraExtra(false);
          
          // Calcular DSR sobre horas extras
          const horasDSR = calcularDSR(totalHorasExtras);
          
          // Calcular valores financeiros
          const salarioMensal = periodo.user?.salarioMensal || 0;
          const valorHora = salarioMensal / (config.diasUteisPorMes * cargaHorariaDiaria);
          
          // Valor das horas extras com percentual configurado
          const valorHorasExtras = totalHorasExtras * valorHora * (1 + percentualHE / 100);
          
          // Valor das horas noturnas (adicional sobre a hora normal)
          const valorAdicionalNoturno = config.calcularAdicionalNoturno 
            ? totalHorasNoturnas * valorHora * (config.percentualAdicionalNoturno / 100)
            : 0;
          
          // Valor do DSR
          const valorDSR = config.calcularDSR ? horasDSR * valorHora * (1 + percentualHE / 100) : 0;
          
          // Descontos
          let descontoAtraso = 0;
          if (config.aplicarDescontoPorAtraso && totalMinutosAtraso > 0) {
            descontoAtraso = (totalMinutosAtraso / 60) * valorHora;
          }
          
          let descontoFaltas = 0;
          if (config.aplicarDescontoPorFalta && diasFaltados > 0) {
            descontoFaltas = diasFaltados * (salarioMensal / config.diasUteisPorMes);
          }

          // Atualizar período com novos cálculos
          await prisma.periodoFechamento.update({
            where: { id: params.id },
            data: {
              totalHorasTrabalhadas,
              totalHorasExtras,
              totalHorasDevidas,
            },
          });

          return {
            // Dados básicos
            diasTrabalhados,
            diasFaltados,
            diasFeriados,
            diasUteisEsperados,
            horasMedias: diasTrabalhados > 0 ? totalHorasTrabalhadas / diasTrabalhados : 0,
            totalHorasTrabalhadas,
            totalHorasExtras,
            totalHorasDevidas,
            
            // Dados avançados
            totalHorasNoturnas,
            totalMinutosAtraso,
            horasDSR,
            percentualHorasExtrasAplicado: percentualHE,
            
            // Valores financeiros
            valorHora: Math.round(valorHora * 100) / 100,
            valorHorasExtras: Math.round(valorHorasExtras * 100) / 100,
            valorAdicionalNoturno: Math.round(valorAdicionalNoturno * 100) / 100,
            valorDSR: Math.round(valorDSR * 100) / 100,
            descontoAtraso: Math.round(descontoAtraso * 100) / 100,
            descontoFaltas: Math.round(descontoFaltas * 100) / 100,
            
            // Total líquido
            totalProventos: Math.round((valorHorasExtras + valorAdicionalNoturno + valorDSR) * 100) / 100,
            totalDescontos: Math.round((descontoAtraso + descontoFaltas) * 100) / 100,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
  )

  // Registros Routes
  .group('/api/registros', (app) =>
    app
      .post(
        '/',
        async ({ body }) => {
          const { data, horario, tipoHorario, entrada, saidaAlmoco, retornoAlmoco, saida, observacao, tipo, status, userId, periodoId, fotoBase64, localizacao } = body;
          
          // Se userId não foi fornecido, pegar o primeiro usuário (fallback para desenvolvimento)
          let userIdFinal = userId;
          if (!userIdFinal) {
            const primeiroUsuario = await prisma.user.findFirst();
            userIdFinal = primeiroUsuario?.id || '';
          }

          // Processar foto base64 - salvar como texto (em produção, usar storage como S3)
          let fotoUrl = null;
          if (fotoBase64) {
            // Por enquanto, salvar a string base64 diretamente
            // Em produção, fazer upload para S3/Cloudinary e salvar apenas a URL
            fotoUrl = fotoBase64;
          }

          // Processar localização
          let localizacaoJson = null;
          if (localizacao) {
            localizacaoJson = JSON.stringify(localizacao);
          }
          
          const registro = await prisma.registroPonto.create({
            data: {
              data: new Date(data),
              horario: horario || null,
              tipoHorario: (tipoHorario as any) || null,
              entrada: entrada || null,
              saidaAlmoco: saidaAlmoco || null,
              retornoAlmoco: retornoAlmoco || null,
              saida: saida || null,
              observacao: observacao || null,
              tipo: (tipo as any) || 'NORMAL',
              status: (status as any) || 'COMPLETO',
              userId: userIdFinal,
              periodoId: periodoId || null,
              fotoUrl,
              localizacao: localizacaoJson,
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
        },
        {
          body: t.Object({
            data: t.String(),
            horario: t.Optional(t.String()),
            tipoHorario: t.Optional(t.String()),
            entrada: t.Optional(t.String()),
            saidaAlmoco: t.Optional(t.String()),
            retornoAlmoco: t.Optional(t.String()),
            saida: t.Optional(t.String()),
            observacao: t.Optional(t.String()),
            tipo: t.Optional(t.String()),
            status: t.Optional(t.String()),
            userId: t.Optional(t.String()),
            periodoId: t.Optional(t.String()),
            fotoBase64: t.Optional(t.String()),
            localizacao: t.Optional(t.Object({
              latitude: t.Number(),
              longitude: t.Number(),
              precisao: t.Number(),
            })),
          }),
        }
      )
      .get(
        '/hoje/:userId',
        async ({ params }) => {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          
          const amanha = new Date(hoje);
          amanha.setDate(amanha.getDate() + 1);

          const registros = await prisma.registroPonto.findMany({
            where: {
              userId: params.userId,
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
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
        }
      )
      .patch(
        '/:id',
        async ({ params, body }) => {
          const updateData: any = {};
          if (body.entrada !== undefined) updateData.entrada = body.entrada || null;
          if (body.saidaAlmoco !== undefined) updateData.saidaAlmoco = body.saidaAlmoco || null;
          if (body.retornoAlmoco !== undefined) updateData.retornoAlmoco = body.retornoAlmoco || null;
          if (body.saida !== undefined) updateData.saida = body.saida || null;
          if (body.observacao !== undefined) updateData.observacao = body.observacao || null;
          if (body.tipo !== undefined) updateData.tipo = body.tipo;
          if (body.status !== undefined) updateData.status = body.status;

          const registro = await prisma.registroPonto.update({
            where: { id: params.id },
            data: updateData,
          });

          return registro;
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            entrada: t.Optional(t.String()),
            saidaAlmoco: t.Optional(t.String()),
            retornoAlmoco: t.Optional(t.String()),
            saida: t.Optional(t.String()),
            observacao: t.Optional(t.String()),
            tipo: t.Optional(t.String()),
            status: t.Optional(t.String()),
          }),
        }
      )
  )

  // Endpoint para buscar registros por período
  .get(
    '/api/periodos/:id/registros',
    async ({ params }) => {
      const registros = await prisma.registroPonto.findMany({
        where: {
          periodoId: params.id,
        },
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
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  .group('/api/registros', (app) =>
    app
      .delete(
        '/:id',
        async ({ params }) => {
          await prisma.registroPonto.delete({
            where: { id: params.id },
          });

          return { success: true };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
  )
  
  .listen(process.env.API_PORT || 3000);

console.log(
  `🦊 Elysia API rodando em ${app.server?.hostname}:${app.server?.port}`
);
