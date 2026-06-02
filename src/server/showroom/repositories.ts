import type { Prisma } from '../../generated/prisma/client';
import { CarListingCondition, CarListingStatus } from '../../generated/prisma/client';
import type { AdminVehicleQuery } from './validation';

export type ShowroomTx = Prisma.TransactionClient;

export const listingDetailInclude = {
  make: true,
  model: true,
  variant: true,
  seller: {
    select: {
      id: true,
      displayName: true,
    },
  },
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

export const listingFullInclude = {
  ...listingDetailInclude,
  priceHistory: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
  modelHistory: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
};

export const adminListingPreviewInclude = listingFullInclude;

export const vehicleRequestInclude = {
  client: {
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      displayName: true,
    },
  },
};

export function buildAdminListingWhere(
  tenantId: string,
  query: AdminVehicleQuery,
): Prisma.CarListingWhereInput {
  return {
    tenantId,
    status: query.status ?? { not: CarListingStatus.DELETED },
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { location: { contains: query.q, mode: 'insensitive' } },
            { make: { name: { contains: query.q, mode: 'insensitive' } } },
            { model: { name: { contains: query.q, mode: 'insensitive' } } },
            { variant: { name: { contains: query.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function findAdminListingById(
  tx: ShowroomTx,
  tenantId: string,
  listingId: string,
) {
  return tx.carListing.findFirst({
    where: {
      tenantId,
      id: listingId,
      status: {
        not: CarListingStatus.DELETED,
      },
    },
    include: adminListingPreviewInclude,
  });
}

export async function countActiveInventoryByCondition(
  tx: ShowroomTx,
  tenantId: string,
): Promise<{ newCars: number; usedCars: number }> {
  const rows = await tx.carListing.groupBy({
    by: ['condition'],
    where: {
      tenantId,
      status: CarListingStatus.ACTIVE,
      condition: {
        in: [CarListingCondition.NEW, CarListingCondition.CERTIFIED_PRE_OWNED, CarListingCondition.USED],
      },
    },
    _count: {
      _all: true,
    },
  });

  return rows.reduce(
    (totals, row) => {
      if (row.condition === CarListingCondition.NEW) {
        totals.newCars += row._count._all;
      } else {
        totals.usedCars += row._count._all;
      }

      return totals;
    },
    { newCars: 0, usedCars: 0 },
  );
}
