import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listarUsuarios() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        pin: true,
        cargo: true,
        departamento: true,
        salarioMensal: true,
        chavePix: true,
        isAdmin: true,
      },
    });

    console.log('\n📋 Usuários cadastrados:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados!');
      console.log('\n💡 Execute: bun run init:production');
    } else {
      users.forEach(user => {
        console.log(`\n👤 ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   PIN: ${user.pin}`);
        console.log(`   Cargo: ${user.cargo || 'Não definido'}`);
        console.log(`   Departamento: ${user.departamento || 'Não definido'}`);
        console.log(`   Salário: R$ ${user.salarioMensal?.toFixed(2) || '0.00'}`);
        console.log(`   PIX: ${user.chavePix || 'Não cadastrado'}`);
        console.log(`   Admin: ${user.isAdmin ? 'Sim' : 'Não'}`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Erro ao consultar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listarUsuarios();
