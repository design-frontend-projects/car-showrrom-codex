import { authGuard } from '../../core/auth/auth.guard';
import { clientRoutes } from './client.routes';
import { ProfilePage } from './profile-page';

describe('clientRoutes', () => {
  it('uses the dedicated guarded profile page route', async () => {
    const route = clientRoutes.find((item) => item.path === 'profile');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(authGuard);

    const component = await route?.loadComponent?.();

    expect(component).toBe(ProfilePage);
  });
});
