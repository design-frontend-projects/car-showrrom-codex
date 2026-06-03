async (page) => {
  const session = {
    status: 'authenticated',
    expiresAt: '2026-06-03T23:59:00.000Z',
    csrfToken: 'csrf',
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      tenantId: '22222222-2222-4222-8222-222222222222',
      tenantSlug: 'demo',
      displayName: 'Admin User',
      email: 'admin@example.com',
      phone: null,
      avatarUrl: null,
      roles: ['admin'],
      permissions: ['showroom.admin.manage'],
      twoFactorEnabled: false,
      twoFactorRequired: false,
    },
  };
  const definition = {
    id: 'definition-1',
    name: 'Toyota',
    normalizedName: 'toyota',
    country: 'Japan',
    isActive: true,
    createdAt: '2026-06-03T12:00:00.000Z',
    updatedAt: '2026-06-03T12:00:00.000Z',
  };
  const users = [
    {
      id: 'user-1',
      tenantId: session.user.tenantId,
      email: 'admin@example.com',
      displayName: 'Admin User',
      phone: null,
      avatarUrl: null,
      isActive: true,
      lastLoginAt: '2026-06-03T12:00:00.000Z',
      createdAt: '2026-06-03T12:00:00.000Z',
      updatedAt: '2026-06-03T12:00:00.000Z',
      roles: [{ id: 'role-1', name: 'admin', description: 'Administrator', isSystem: true }],
    },
  ];

  await page.context().unroute('**/api/auth/session').catch(() => undefined);
  await page.context().unroute('**/api/showroom/admin/definitions/**').catch(() => undefined);
  await page.context().unroute('**/api/showroom/admin/users-roles**').catch(() => undefined);
  await page.context().route('**/api/auth/session', (route) => route.fulfill({ json: session }));
  await page.context().route('**/api/showroom/admin/definitions/**', (route) => route.fulfill({ json: [definition] }));
  await page.context().route('**/api/showroom/admin/users-roles**', (route) => route.fulfill({ json: users }));

  await page.goto('http://127.0.0.1:4300/admin/definitions');
  await page.waitForLoadState('networkidle');
  return {
    url: page.url(),
    text: await page.locator('body').innerText(),
    dir: await page.locator('html').getAttribute('dir'),
    lang: await page.locator('html').getAttribute('lang'),
  };
}
