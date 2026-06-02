import type { Prisma } from '../../generated/prisma/client';

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
