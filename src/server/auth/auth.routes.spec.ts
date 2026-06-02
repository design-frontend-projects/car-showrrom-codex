import express from 'express';
import request from 'supertest';
import { registerAuthRoutes } from './auth.routes';

describe('auth routes', () => {
  it('issues a CSRF token cookie', async () => {
    const app = express();
    app.use('/api', express.json());
    registerAuthRoutes(app);

    const response = await request(app).get('/api/auth/csrf').expect(200);

    expect(response.body.csrfToken).toEqual(expect.any(String));
    const setCookie = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);

    expect(cookies).toContain('cs_csrf=');
  });

  it('rejects cookie-authenticated mutations without CSRF', async () => {
    const app = express();
    app.use('/api', express.json());
    registerAuthRoutes(app);

    const response = await request(app).post('/api/auth/logout').send({}).expect(403);

    expect(response.body.code).toBe('auth.error.csrf');
  });
});
