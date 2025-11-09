import { Elysia } from 'elysia';
import { ConfiguracoesService } from './service';
import { ConfiguracoesModel } from './model';

// Controller: Handle HTTP routing
export const configuracoesController = new Elysia({ 
  name: 'Controller.Configuracoes',
  prefix: '/api/configuracoes' 
})
  .use(ConfiguracoesModel)
  .get('/', () => ConfiguracoesService.get())
  .post('/', ({ body }) => {
    ConfiguracoesService.update(body);
    return { success: true, configuracoes: ConfiguracoesService.get() };
  }, {
    body: 'configuracoes.update',
  });
