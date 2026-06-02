import express from 'express';
import request from 'supertest';
import { registerShowroomRoutes } from './routes';

describe('showroom routes', () => {
  it('requires tenant context for public listing search', async () => {
    const app = express();
    app.use('/api', express.json());
    registerShowroomRoutes(app);

    const response = await request(app).get('/api/showroom/listings').expect(400);

    expect(response.body.code).toBe('showroom.error.tenantRequired');
  });

  it('rejects unsafe media storage keys before filesystem access', async () => {
    const app = express();
    registerShowroomRoutes(app);

    const response = await request(app).get('/media/listings/..%2Fsecret.png').expect(404);

    expect(response.body.code).toBe('showroom.error.mediaNotFound');
  });

  it('rejects showroom mutations without a valid CSRF token', async () => {
    const app = express();
    app.use('/api', express.json());
    registerShowroomRoutes(app);

    const response = await request(app)
      .post('/api/showroom/client/listings')
      .set('X-Tenant-Id', '00000000-0000-0000-0000-000000000001')
      .send({})
      .expect(403);

    expect(response.body.code).toBe('showroom.error.csrf');
  });
});
