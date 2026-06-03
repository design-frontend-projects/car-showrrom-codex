import express from 'express';
import request from 'supertest';
import { registerAdminRbacRoutes } from './admin-rbac.routes';

const tenantId = '11111111-1111-4111-8111-111111111111';

describe('admin RBAC routes', () => {
  it('rejects anonymous admin reads before repository work', async () => {
    const app = express();
    app.use('/api', express.json());
    registerAdminRbacRoutes(app);

    const response = await request(app)
      .get('/api/admin/rbac/users')
      .set('x-tenant-id', tenantId)
      .expect(401);

    expect(response.body.error).toBe('An authenticated admin session is required.');
  });

  it('rejects cookie-authenticated mutations without CSRF before writes', async () => {
    const app = express();
    app.use('/api', express.json());
    registerAdminRbacRoutes(app);

    const response = await request(app)
      .post('/api/admin/rbac/users')
      .set('x-tenant-id', tenantId)
      .send({
        email: 'admin@example.com',
        displayName: 'Admin User',
        initialPassword: 'Password1!',
      })
      .expect(403);

    expect(response.body.error).toBe('A valid CSRF token is required.');
  });
});
