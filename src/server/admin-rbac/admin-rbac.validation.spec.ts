import { createUserSchema, inviteUserSchema, updateUserSchema } from './admin-rbac.validation';

describe('admin RBAC validation', () => {
  it('rejects browser-supplied password hashes for user creation', () => {
    const result = createUserSchema.safeParse({
      email: 'user@example.com',
      displayName: 'User Example',
      passwordHash: 'client-hash',
      initialPassword: 'Password1!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects secret-bearing update fields', () => {
    const result = updateUserSchema.safeParse({
      tokenHash: 'not-allowed',
      displayName: 'User Example',
    });

    expect(result.success).toBe(false);
  });

  it('keeps invitation token hashes out of invitation payloads', () => {
    const result = inviteUserSchema.safeParse({
      email: 'invitee@example.com',
      displayName: 'Invitee',
      tokenHash: 'not-allowed',
    });

    expect(result.success).toBe(false);
  });
});
