import { authGuard } from '../../core/auth/auth.guard';
import { clientRoutes } from './client.routes';
import { InvitationOnboardingPage } from './invitation-onboarding-page';
import { ProfilePage } from './profile-page';

describe('clientRoutes', () => {
  it('uses the dedicated guarded profile page route', async () => {
    const route = clientRoutes.find((item) => item.path === 'profile');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(authGuard);

    const component = await route?.loadComponent?.();

    expect(component).toBe(ProfilePage);
  });

  it('exposes an unguarded invited-user onboarding route', async () => {
    const route = clientRoutes.find((item) => item.path === 'onboarding');

    expect(route).toBeTruthy();
    expect(route?.canActivate).toBeUndefined();

    const component = await route?.loadComponent?.();

    expect(component).toBe(InvitationOnboardingPage);
  });
});
