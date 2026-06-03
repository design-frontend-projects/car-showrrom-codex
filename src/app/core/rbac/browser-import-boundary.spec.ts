import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbiddenImports = [
  '@prisma/client',
  '@prisma/adapter-pg',
  '../../generated/prisma',
  'generated/prisma',
  'bcryptjs',
  'node:crypto',
  'pg',
  '../auth/auth.service',
  '../auth/auth.crypto',
  '../auth/password.service',
  '../server/',
];

describe('RBAC browser import boundary', () => {
  it('does not import server-only database, hashing, or secret modules under src/app', () => {
    const violations = listTsFiles(join(process.cwd(), 'src/app'))
      .map((file) => ({
        file,
        imports: readImports(readFileSync(file, 'utf8')),
      }))
      .flatMap(({ file, imports }) =>
        forbiddenImports
          .filter((forbidden) => imports.some((specifier) => specifier.includes(forbidden)))
          .map((forbidden) => `${file}: ${forbidden}`),
      );

    expect(violations).toEqual([]);
  });
});

function listTsFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      const stat = statSync(path);

      if (stat.isDirectory()) {
        return listTsFiles(path);
      }

      return path.endsWith('.ts') ? [path] : [];
    });
}

function readImports(content: string): string[] {
  return Array.from(content.matchAll(/from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)).map(
    (match) => match[1] ?? match[2] ?? '',
  );
}
