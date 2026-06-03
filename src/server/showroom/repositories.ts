import type { Prisma } from '../../generated/prisma/client';
import { CarListingCondition, CarListingStatus } from '../../generated/prisma/client';
import type { AdminVehicleQuery, InventoryScope, SearchQuery } from './validation';

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

export const NEW_INVENTORY_CONDITIONS = [CarListingCondition.NEW] as const;
export const USED_INVENTORY_CONDITIONS = [
  CarListingCondition.CERTIFIED_PRE_OWNED,
  CarListingCondition.USED,
  CarListingCondition.DAMAGED,
] as const;

export function conditionsForInventoryScope(scope: InventoryScope): CarListingCondition[] {
  return scope === 'new' ? [...NEW_INVENTORY_CONDITIONS] : [...USED_INVENTORY_CONDITIONS];
}

export function buildActiveListingWhere(
  tenantId: string,
  query: SearchQuery,
): Prisma.CarListingWhereInput {
  const conditionFilter = query.inventoryScope
    ? { in: conditionsForInventoryScope(query.inventoryScope) }
    : query.condition;

  return {
    tenantId,
    status: CarListingStatus.ACTIVE,
    ...(query.makeId ? { makeId: query.makeId } : {}),
    ...(query.modelId ? { modelId: query.modelId } : {}),
    ...(query.variantId ? { variantId: query.variantId } : {}),
    ...(conditionFilter ? { condition: conditionFilter } : {}),
    ...(query.location ? { location: { contains: query.location, mode: 'insensitive' } } : {}),
    ...(query.minYear || query.maxYear
      ? {
          modelYear: removeUndefined({
            gte: query.minYear,
            lte: query.maxYear,
          }),
        }
      : {}),
    ...(query.minPrice || query.maxPrice
      ? {
          price: removeUndefined({
            gte: query.minPrice,
            lte: query.maxPrice,
          }),
        }
      : {}),
    ...(query.minMileage || query.maxMileage
      ? {
          mileage: removeUndefined({
            gte: query.minMileage,
            lte: query.maxMileage,
          }),
        }
      : {}),
    ...(query.bodyType || query.fuelType || query.transmission
      ? {
          variant: removeUndefined({
            bodyType: query.bodyType,
            fuelType: query.fuelType,
            transmission: query.transmission,
          }),
        }
      : {}),
    ...(query.color
      ? {
          OR: [
            { exteriorColorName: { contains: query.color, mode: 'insensitive' } },
            { interiorColorName: { contains: query.color, mode: 'insensitive' } },
          ],
        }
      : {}),
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
        in: [...NEW_INVENTORY_CONDITIONS, ...USED_INVENTORY_CONDITIONS],
      },
    },
    _count: {
      _all: true,
    },
  });

  return rows.reduce(
    (totals, row) => {
      if ((NEW_INVENTORY_CONDITIONS as readonly CarListingCondition[]).includes(row.condition)) {
        totals.newCars += row._count._all;
      } else if ((USED_INVENTORY_CONDITIONS as readonly CarListingCondition[]).includes(row.condition)) {
        totals.usedCars += row._count._all;
      }

      return totals;
    },
    { newCars: 0, usedCars: 0 },
  );
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, unknown] => entry[1] !== undefined),
  ) as T;
}
