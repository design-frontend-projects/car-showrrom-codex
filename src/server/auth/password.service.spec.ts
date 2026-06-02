import { hashPassword, verifyPassword } from './password.service';

describe('password service', () => {
  it('hashes passwords and verifies only the original plaintext', async () => {
    const hash = await hashPassword('StrongerPass1!');

    expect(hash).not.toBe('StrongerPass1!');
    await expect(verifyPassword('StrongerPass1!', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });
});
