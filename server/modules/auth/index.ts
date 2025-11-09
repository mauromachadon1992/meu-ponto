import { Elysia } from 'elysia';
import { AuthService } from './service';
import { AuthModel } from './model';

// Controller: Handle HTTP routing
export const authController = new Elysia({ 
  name: 'Controller.Auth',
  prefix: '/api/auth' 
})
  .use(AuthModel)
  .post('/login-pin', async ({ body }) => {
    const { pin } = body;
    return AuthService.loginWithPin(pin);
  }, {
    body: 'auth.loginPin',
  })
  .post('/login-face', async ({ body }) => {
    const { userId, fotoBase64 } = body;
    return AuthService.loginWithFace(userId, fotoBase64);
  }, {
    body: 'auth.loginFace',
  });
