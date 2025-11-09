/**
 * Script de Inicialização de Produção
 * 
 * Este script realiza:
 * 1. Limpa todos os dados do banco (usuários, registros, períodos)
 * 2. Executa todas as migrations
 * 3. Cria um usuário Admin com senha aleatória gerada
 * 
 * USO: bun run scripts/init-production.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

// Gera uma senha segura aleatória
function gerarSenhaSegura(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let senha = '';
  const randomValues = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    senha += charset[randomValues[i] % charset.length];
  }
  
  return senha;
}

// Gera um PIN de 4 dígitos único
function gerarPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function limparBancoDados() {
  console.log('\n🗑️  Limpando banco de dados...');
  
  try {
    // Deleta na ordem correta devido às foreign keys
    await prisma.registroPonto.deleteMany({});
    console.log('   ✓ Registros de ponto deletados');
    
    await prisma.periodoFechamento.deleteMany({});
    console.log('   ✓ Períodos de fechamento deletados');
    
    await prisma.user.deleteMany({});
    console.log('   ✓ Usuários deletados');
    
    console.log('✅ Banco de dados limpo com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    throw error;
  }
}

async function criarUsuarioAdmin() {
  console.log('👤 Criando usuário administrador...\n');
  
  const senha = gerarSenhaSegura();
  const pin = gerarPIN();
  
  try {
    const admin = await prisma.user.create({
      data: {
        nome: 'Administrador',
        email: 'admin@meuponto.com',
        pin: pin,
        cargo: 'Administrador do Sistema',
        departamento: 'TI',
        cargaHorariaDiaria: 8.0,
        salarioMensal: 0, // Definir conforme necessário
        isAdmin: true,
      },
    });
    
    console.log('✅ Usuário Admin criado com sucesso!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIAIS DO ADMINISTRADOR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Nome:     ${admin.nome}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   PIN:      ${pin}`);
    console.log(`   Senha:    ${senha}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE: Guarde estas credenciais em local seguro!');
    console.log('   O PIN será usado para login no sistema.');
    console.log('   A senha pode ser usada para funcionalidades futuras.\n');
    
    return { admin, senha, pin };
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  }
}

async function verificarConexao() {
  console.log('🔌 Verificando conexão com banco de dados...');
  
  try {
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    console.error('\n💡 Verifique:');
    console.error('   - O PostgreSQL está rodando?');
    console.error('   - A variável DATABASE_URL está correta no .env?');
    console.error('   - O banco de dados existe?\n');
    throw error;
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   SCRIPT DE INICIALIZAÇÃO DE PRODUÇÃO            ║');
  console.log('║   Sistema: Meu Ponto                              ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  try {
    // 1. Verificar conexão
    await verificarConexao();
    
    // 2. Limpar banco de dados
    await limparBancoDados();
    
    // 3. Criar usuário admin
    const { admin, senha, pin } = await criarUsuarioAdmin();
    
    console.log('🎉 Inicialização concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Faça login no sistema com o PIN: ' + pin);
    console.log('   2. Configure os parâmetros do sistema em "Configurações"');
    console.log('   3. Crie os demais usuários do sistema');
    console.log('   4. Configure períodos de fechamento\n');
    
    // Salvar credenciais em arquivo (opcional)
    const credenciais = {
      data: new Date().toISOString(),
      admin: {
        nome: admin.nome,
        email: admin.email,
        pin: pin,
        senha: senha,
      },
    };
    
    writeFileSync(
      'credentials-admin.json',
      JSON.stringify(credenciais, null, 2),
      'utf-8'
    );
    
    console.log('💾 Credenciais salvas em: credentials-admin.json');
    console.log('⚠️  Lembre-se de deletar este arquivo após anotar as credenciais!\n');
    
  } catch (error) {
    console.error('\n❌ Falha na inicialização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmação de segurança
console.log('\n⚠️  ATENÇÃO: Este script irá DELETAR TODOS os dados do banco!');
console.log('   Todos os usuários, registros e períodos serão removidos.');
console.log('\n   Pressione Ctrl+C para cancelar ou aguarde 5 segundos...\n');

// Aguarda 5 segundos antes de executar
await new Promise(resolve => setTimeout(resolve, 5000));

main();
