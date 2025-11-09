-- Script de inicialização do banco de dados
-- Este script será executado automaticamente na primeira inicialização

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Garantir que o usuário tem as permissões corretas
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Mensagem de sucesso
SELECT 'Database initialized successfully!' as message;
