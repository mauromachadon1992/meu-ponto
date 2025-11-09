import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpar dados existentes
  await prisma.registroPonto.deleteMany();
  await prisma.periodoFechamento.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários
  const users = await Promise.all([
    prisma.user.create({
      data: {
        nome: 'João Silva',
        email: 'joao.silva@empresa.com',
        pin: '1234',
        cargo: 'Desenvolvedor',
        departamento: 'TI',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
        cargaHorariaDiaria: 8.0,
        salarioMensal: 5000.00, // R$ 5.000,00
        isAdmin: true, // João é admin
      },
    }),
    prisma.user.create({
      data: {
        nome: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        pin: '5678',
        cargo: 'Gerente de Projetos',
        departamento: 'Gestão',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
        cargaHorariaDiaria: 8.0,
        salarioMensal: 8000.00, // R$ 8.000,00
        isAdmin: false,
      },
    }),
    prisma.user.create({
      data: {
        nome: 'Pedro Oliveira',
        email: 'pedro.oliveira@empresa.com',
        pin: '9999',
        cargo: 'Designer',
        departamento: 'UX/UI',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
        cargaHorariaDiaria: 6.0, // Pedro trabalha 6h por dia
        salarioMensal: 4500.00, // R$ 4.500,00
        isAdmin: false,
      },
    }),
  ]);

  console.log(`✅ ${users.length} usuários criados`);

  // Criar períodos e registros para cada usuário
  for (const user of users) {
    // Mês passado
    const mesPassado = new Date();
    mesPassado.setMonth(mesPassado.getMonth() - 1);
    mesPassado.setDate(1);
    mesPassado.setHours(0, 0, 0, 0);

    const fimMesPassado = new Date(mesPassado);
    fimMesPassado.setMonth(fimMesPassado.getMonth() + 1);
    fimMesPassado.setDate(0);
    fimMesPassado.setHours(23, 59, 59, 999);

    const periodoPassado = await prisma.periodoFechamento.create({
      data: {
        userId: user.id,
        dataInicio: mesPassado,
        dataFim: fimMesPassado,
        totalHorasTrabalhadas: 176,
        totalHorasExtras: 12,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: 'APROVADO',
        observacoes: 'Mês fechado com horas extras',
      },
    });

    // Criar registros para o mês passado
    const diasUteis = getDiasUteis(mesPassado, fimMesPassado);
    for (const dia of diasUteis) {
      await prisma.registroPonto.create({
        data: {
          userId: user.id,
          periodoId: periodoPassado.id,
          data: dia,
          entrada: '08:00',
          saidaAlmoco: '12:00',
          retornoAlmoco: '13:00',
          saida: '17:00',
          tipo: 'NORMAL',
          status: 'COMPLETO',
        },
      });
    }

    // Mês atual
    const mesAtual = new Date();
    mesAtual.setDate(1);
    mesAtual.setHours(0, 0, 0, 0);

    const fimMesAtual = new Date(mesAtual);
    fimMesAtual.setMonth(fimMesAtual.getMonth() + 1);
    fimMesAtual.setDate(0);
    fimMesAtual.setHours(23, 59, 59, 999);

    const periodoAtual = await prisma.periodoFechamento.create({
      data: {
        userId: user.id,
        dataInicio: mesAtual,
        dataFim: fimMesAtual,
        totalHorasTrabalhadas: 88,
        totalHorasExtras: 4,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: 'ABERTO',
        observacoes: 'Mês atual em andamento',
      },
    });

    // Criar registros para o mês atual (apenas até hoje)
    const hoje = new Date();
    const diasUteisAteHoje = getDiasUteis(mesAtual, hoje);
    for (const dia of diasUteisAteHoje) {
      await prisma.registroPonto.create({
        data: {
          userId: user.id,
          periodoId: periodoAtual.id,
          data: dia,
          entrada: '08:00',
          saidaAlmoco: '12:00',
          retornoAlmoco: '13:00',
          saida: '17:00',
          tipo: 'NORMAL',
          status: 'COMPLETO',
        },
      });
    }

    console.log(`✅ Períodos e registros criados para ${user.nome}`);
  }

  console.log('🎉 Seed concluído!');
}

function getDiasUteis(dataInicio: Date, dataFim: Date): Date[] {
  const dias: Date[] = [];
  const atual = new Date(dataInicio);

  while (atual <= dataFim) {
    const diaSemana = atual.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias.push(new Date(atual));
    }
    atual.setDate(atual.getDate() + 1);
  }

  return dias;
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
