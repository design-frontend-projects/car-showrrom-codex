import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../db/prisma';

export type AuthTransactionClient = Prisma.TransactionClient;

export async function withAuthDatabaseContext<T>(
  work: (tx: AuthTransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.rbac_bypass', 'true', true)`;

    return work(tx);
  });
}
