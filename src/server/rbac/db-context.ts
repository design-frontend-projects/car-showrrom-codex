import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '../db/prisma';

export interface RbacDatabaseContext {
  tenantId: string;
  bypassTenantIsolation: boolean;
}

export type RbacTransactionClient = Prisma.TransactionClient;

export async function withRbacDatabaseContext<T>(
  context: RbacDatabaseContext,
  work: (tx: RbacTransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${context.tenantId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.rbac_bypass', ${context.bypassTenantIsolation ? 'true' : 'false'}, true)`;

    return work(tx);
  });
}
