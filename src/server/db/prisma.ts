import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const DEFAULT_DATABASE_SCHEMA = 'showroom';

function getDatabaseUrl(): string {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for server database access. Set it to postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom for local development.',
    );
  }

  return databaseUrl;
}

function getDatabaseSchema(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).searchParams.get('schema') ?? DEFAULT_DATABASE_SCHEMA;
  } catch {
    return DEFAULT_DATABASE_SCHEMA;
  }
}

const databaseUrl = getDatabaseUrl();
const adapter = new PrismaPg(
  { connectionString: databaseUrl },
  { schema: getDatabaseSchema(databaseUrl) },
);

export const prisma = new PrismaClient({ adapter });

export async function checkDatabaseReady(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
