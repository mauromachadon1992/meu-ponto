import { Elysia, t } from 'elysia';

// Models para Configurações - sem validação estrita para permitir flexibilidade
export const ConfiguracoesModel = new Elysia({ name: 'Model.Configuracoes' })
  .model({
    'configuracoes.get': t.Any(),
    'configuracoes.update': t.Any(),
  });
