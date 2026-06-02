import express from 'express';
import request from 'supertest';
import { AuthHttpError } from './auth.errors';
import { registerAuthRoutes } from './auth.routes';
import type { CurrentProfileDto } from './auth.service';

describe('auth profile route', () => {
  const readCurrentProfileMock = vi.fn<(sessionToken: string | null) => Promise<CurrentProfileDto>>();

  beforeEach(() => {
    readCurrentProfileMock.mockReset();
  });

  it('returns sanitized current profile data for the session cookie', async () => {
    const profile = {
      id: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      avatarUrl: null,
      isActive: true,
      tenant: {
        id: '22222222-2222-4222-8222-222222222222',
        slug: 'public-showroom',
        name: 'Public Showroom',
      },
      roles: ['guest'],
      twoFactorEnabled: true,
      twoFactorRequired: false,
      lastLoginAt: '2026-06-03T08:00:00.000Z',
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: '2026-06-02T08:00:00.000Z',
    };
    readCurrentProfileMock.mockResolvedValue(profile);
    const app = createApp(readCurrentProfileMock);

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Cookie', ['cs_session=session-token'])
      .expect(200);

    expect(readCurrentProfileMock).toHaveBeenCalledWith('session-token');
    expect(response.body).toEqual(profile);
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.sessionTokenHash).toBeUndefined();
    expect(response.body.csrfTokenHash).toBeUndefined();
    expect(response.body.twoFactorSecretEncrypted).toBeUndefined();
    expect(response.body.backupCodes).toBeUndefined();
    expect(response.body.failedLoginCount).toBeUndefined();
  });

  it('rejects anonymous profile requests', async () => {
    readCurrentProfileMock.mockRejectedValue(new AuthHttpError(401, 'auth.error.unauthorized'));
    const app = createApp(readCurrentProfileMock);

    const response = await request(app).get('/api/auth/profile').expect(401);

    expect(readCurrentProfileMock).toHaveBeenCalledWith(null);
    expect(response.body.code).toBe('auth.error.unauthorized');
  });
});

function createApp(readCurrentProfileMock: (sessionToken: string | null) => Promise<CurrentProfileDto>) {
  const app = express();
  app.use('/api', express.json());
  registerAuthRoutes(app, { readCurrentProfile: readCurrentProfileMock });

  return app;
}
