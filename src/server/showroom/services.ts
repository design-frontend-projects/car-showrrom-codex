import type { Prisma } from '../../generated/prisma/client';
import { randomUUID } from 'node:crypto';
import { CarListingStatus, VehicleRequestStatus } from '../../generated/prisma/client';
import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import { canAdminShowroom, type ShowroomContext } from './auth';
import { showroomConfig } from './config';
import {
  mapImage,
  mapListingDetail,
  mapListingSummary,
  mapMake,
  mapModel,
  mapVariant,
  mapVehicleRequest,
} from './dto';
import { ShowroomHttpError } from './errors';
import {
  listingDetailInclude,
  listingFullInclude,
  type ShowroomTx,
  vehicleRequestInclude,
} from './repositories';
import {
  type ListingInput,
  type ListingUpdateInput,
  type RequestReviewInput,
  type SearchQuery,
  type VehicleRequestInput,
} from './validation';

export async function listTaxonomy(tx: ShowroomTx, tenantId: string): Promise<unknown> {
  const [makes, colors] = await Promise.all([
    tx.carMake.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        models: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    }),
    tx.carColor.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    makes: makes.map((make) => ({
      ...mapMake(make),
      models: make.models.map((model) => ({
        ...mapModel(model),
        variants: model.variants.map(mapVariant),
      })),
    })),
    colors: colors.map((color) => ({
      id: color.id,
      name: color.name,
      hexCode: color.hexCode,
    })),
    bodyTypes: ['SEDAN', 'SUV', 'COUPE', 'HATCHBACK', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'CROSSOVER', 'OTHER'],
    fuelTypes: ['PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER'],
    transmissions: ['AUTOMATIC', 'MANUAL', 'CVT', 'DUAL_CLUTCH', 'OTHER'],
    conditions: ['NEW', 'CERTIFIED_PRE_OWNED', 'USED', 'DAMAGED'],
  };
}

export async function listMakes(tx: ShowroomTx, tenantId: string): Promise<unknown[]> {
  const makes = await tx.carMake.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  });

  return makes.map(mapMake);
}

export async function listModels(tx: ShowroomTx, tenantId: string, makeId?: string): Promise<unknown[]> {
  const models = await tx.carModel.findMany({
    where: { tenantId, isActive: true, ...(makeId ? { makeId } : {}) },
    orderBy: { name: 'asc' },
  });

  return models.map(mapModel);
}

export async function listVariants(
  tx: ShowroomTx,
  tenantId: string,
  modelId?: string,
): Promise<unknown[]> {
  const variants = await tx.carVariant.findMany({
    where: { tenantId, isActive: true, ...(modelId ? { modelId } : {}) },
    orderBy: { name: 'asc' },
  });

  return variants.map(mapVariant);
}

export async function searchListings(
  tx: ShowroomTx,
  tenantId: string,
  query: SearchQuery,
): Promise<unknown> {
  const where = buildSearchWhere(tenantId, query);
  const orderBy = buildSearchOrder(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    tx.carListing.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      include: listingDetailInclude,
    }),
    tx.carListing.count({ where }),
  ]);

  return {
    items: items.map(mapListingSummary),
    page: query.page,
    pageSize: query.pageSize,
    total,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

export async function getPublicListing(
  tx: ShowroomTx,
  tenantId: string,
  listingId: string,
): Promise<unknown> {
  const listing = await tx.carListing.findFirst({
    where: {
      tenantId,
      id: listingId,
      status: CarListingStatus.ACTIVE,
    },
    include: listingFullInclude,
  });

  if (!listing) {
    throw new ShowroomHttpError(404, 'showroom.error.listingNotFound');
  }

  return mapListingDetail(listing);
}

export async function listClientListings(tx: ShowroomTx, context: ShowroomContext): Promise<unknown> {
  const listings = await tx.carListing.findMany({
    where: {
      tenantId: context.tenantId,
      sellerUserId: context.userId,
      status: {
        not: CarListingStatus.DELETED,
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: listingDetailInclude,
  });

  const activeCount = await countActiveListings(tx, context.tenantId, context.userId);

  return {
    activeCount,
    activeLimit: 5,
    items: listings.map(mapListingSummary),
  };
}

export async function createListing(
  tx: ShowroomTx,
  context: ShowroomContext,
  input: ListingInput,
): Promise<unknown> {
  await assertTaxonomyHierarchy(tx, context.tenantId, input.makeId, input.modelId, input.variantId);

  const status = input.status ?? CarListingStatus.DRAFT;

  if (status === CarListingStatus.ACTIVE) {
    await assertActiveListingLimit(tx, context.tenantId, context.userId);
  }

  const listing = await tx.carListing.create({
    data: {
      tenantId: context.tenantId,
      sellerUserId: context.userId,
      makeId: input.makeId,
      modelId: input.modelId,
      variantId: input.variantId,
      exteriorColorId: input.exteriorColorId ?? null,
      interiorColorId: input.interiorColorId ?? null,
      title: input.title,
      slug: createSlug(input.title),
      vin: input.vin ?? null,
      modelYear: input.modelYear,
      price: input.price,
      currency: input.currency,
      mileage: input.mileage,
      condition: input.condition,
      exteriorColorName: input.exteriorColorName ?? null,
      interiorColorName: input.interiorColorName ?? null,
      location: input.location,
      description: input.description,
      status,
      publishedAt: status === CarListingStatus.ACTIVE ? new Date() : null,
    },
    include: listingDetailInclude,
  });

  return mapListingDetail(listing);
}

export async function updateListing(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  input: ListingUpdateInput,
): Promise<unknown> {
  const existing = await getManageableListing(tx, context, listingId);
  const makeId = input.makeId ?? existing.makeId;
  const modelId = input.modelId ?? existing.modelId;
  const variantId = input.variantId ?? existing.variantId;

  await assertTaxonomyHierarchy(tx, context.tenantId, makeId, modelId, variantId);

  const priceChanged = input.price !== undefined && Number(existing.price) !== input.price;
  const modelChanged =
    makeId !== existing.makeId ||
    modelId !== existing.modelId ||
    variantId !== existing.variantId ||
    (input.modelYear !== undefined && input.modelYear !== existing.modelYear);

  const updated = await tx.carListing.update({
    where: {
      tenantId_id: {
        tenantId: context.tenantId,
        id: listingId,
      },
    },
    data: removeUndefined({
      makeId: input.makeId,
      modelId: input.modelId,
      variantId: input.variantId,
      exteriorColorId: input.exteriorColorId,
      interiorColorId: input.interiorColorId,
      title: input.title,
      vin: input.vin,
      modelYear: input.modelYear,
      price: input.price,
      currency: input.currency,
      mileage: input.mileage,
      condition: input.condition,
      exteriorColorName: input.exteriorColorName,
      interiorColorName: input.interiorColorName,
      location: input.location,
      description: input.description,
      status: input.status,
    }),
    include: listingDetailInclude,
  });

  if (priceChanged && input.price !== undefined) {
    await tx.carPriceHistory.create({
      data: {
        tenantId: context.tenantId,
        listingId,
        oldPrice: existing.price,
        newPrice: input.price,
        currency: input.currency ?? existing.currency,
        changedByUserId: context.userId,
        reason: input.priceChangeReason ?? null,
      },
    });
  }

  if (modelChanged) {
    await tx.carModelHistory.create({
      data: {
        tenantId: context.tenantId,
        listingId,
        oldMakeId: existing.makeId,
        newMakeId: makeId,
        oldModelId: existing.modelId,
        newModelId: modelId,
        oldVariantId: existing.variantId,
        newVariantId: variantId,
        oldModelYear: existing.modelYear,
        newModelYear: input.modelYear ?? existing.modelYear,
        diff: {
          makeId: [existing.makeId, makeId],
          modelId: [existing.modelId, modelId],
          variantId: [existing.variantId, variantId],
          modelYear: [existing.modelYear, input.modelYear ?? existing.modelYear],
        },
        changedByUserId: context.userId,
        reason: input.modelChangeReason ?? null,
      },
    });
  }

  return mapListingDetail(updated);
}

export async function transitionListingStatus(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  status: CarListingStatus,
): Promise<unknown> {
  const listing = await getManageableListing(tx, context, listingId);

  if (status === CarListingStatus.ACTIVE && listing.status !== CarListingStatus.ACTIVE) {
    await assertActiveListingLimit(tx, context.tenantId, listing.sellerUserId);
  }

  const updated = await tx.carListing.update({
    where: {
      tenantId_id: {
        tenantId: context.tenantId,
        id: listingId,
      },
    },
    data: {
      status,
      publishedAt: status === CarListingStatus.ACTIVE ? new Date() : listing.publishedAt,
      soldAt: status === CarListingStatus.SOLD ? new Date() : listing.soldAt,
      archivedAt: status === CarListingStatus.ARCHIVED ? new Date() : listing.archivedAt,
    },
    include: listingDetailInclude,
  });

  return mapListingDetail(updated);
}

export async function deleteListing(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
): Promise<void> {
  await getManageableListing(tx, context, listingId);

  await tx.carListing.update({
    where: {
      tenantId_id: {
        tenantId: context.tenantId,
        id: listingId,
      },
    },
    data: {
      status: CarListingStatus.DELETED,
    },
  });
}

export async function addListingImage(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  image: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    byteSize: number;
  },
  metadata: { altText?: string; isPrimary?: boolean },
): Promise<unknown> {
  await getManageableListing(tx, context, listingId);
  const imageCount = await tx.carListingImage.count({
    where: {
      tenantId: context.tenantId,
      listingId,
    },
  });

  if (imageCount >= showroomConfig.maxImagesPerListing) {
    throw new ShowroomHttpError(400, 'showroom.error.imageLimit', {
      image: 'showroom.error.imageLimit',
    });
  }

  const maxOrder = await tx.carListingImage.aggregate({
    where: {
      tenantId: context.tenantId,
      listingId,
    },
    _max: {
      sortOrder: true,
    },
  });
  const shouldBePrimary = metadata.isPrimary === true || imageCount === 0;

  if (shouldBePrimary) {
    await tx.carListingImage.updateMany({
      where: {
        tenantId: context.tenantId,
        listingId,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  const created = await tx.carListingImage.create({
    data: {
      tenantId: context.tenantId,
      listingId,
      storageKey: image.storageKey,
      originalName: image.originalName,
      mimeType: image.mimeType,
      byteSize: image.byteSize,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      isPrimary: shouldBePrimary,
      altText: metadata.altText ?? null,
    },
  });

  return mapImage(created);
}

export async function deleteListingImage(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  imageId: string,
): Promise<string> {
  await getManageableListing(tx, context, listingId);
  const image = await tx.carListingImage.findFirst({
    where: {
      tenantId: context.tenantId,
      listingId,
      id: imageId,
    },
  });

  if (!image) {
    throw new ShowroomHttpError(404, 'showroom.error.imageNotFound');
  }

  await tx.carListingImage.delete({
    where: {
      id: image.id,
    },
  });

  if (image.isPrimary) {
    const nextImage = await tx.carListingImage.findFirst({
      where: {
        tenantId: context.tenantId,
        listingId,
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (nextImage) {
      await tx.carListingImage.update({
        where: { id: nextImage.id },
        data: { isPrimary: true },
      });
    }
  }

  return image.storageKey;
}

export async function reorderListingImages(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  imageIds: string[],
): Promise<unknown[]> {
  await getManageableListing(tx, context, listingId);
  const images = await tx.carListingImage.findMany({
    where: {
      tenantId: context.tenantId,
      listingId,
      id: {
        in: imageIds,
      },
    },
  });

  if (images.length !== imageIds.length) {
    throw new ShowroomHttpError(400, 'showroom.error.imageOrderInvalid');
  }

  for (const [index, imageId] of imageIds.entries()) {
    await tx.carListingImage.update({
      where: { id: imageId },
      data: { sortOrder: index + 10_000 },
    });
  }

  for (const [index, imageId] of imageIds.entries()) {
    await tx.carListingImage.update({
      where: { id: imageId },
      data: { sortOrder: index },
    });
  }

  const ordered = await tx.carListingImage.findMany({
    where: {
      tenantId: context.tenantId,
      listingId,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return ordered.map(mapImage);
}

export async function setPrimaryImage(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  imageId: string,
): Promise<unknown[]> {
  await getManageableListing(tx, context, listingId);
  const image = await tx.carListingImage.findFirst({
    where: {
      tenantId: context.tenantId,
      listingId,
      id: imageId,
    },
  });

  if (!image) {
    throw new ShowroomHttpError(404, 'showroom.error.imageNotFound');
  }

  await tx.carListingImage.updateMany({
    where: {
      tenantId: context.tenantId,
      listingId,
    },
    data: {
      isPrimary: false,
    },
  });
  await tx.carListingImage.update({
    where: {
      id: imageId,
    },
    data: {
      isPrimary: true,
    },
  });

  const images = await tx.carListingImage.findMany({
    where: {
      tenantId: context.tenantId,
      listingId,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return images.map(mapImage);
}

export async function createVehicleRequest(
  tx: ShowroomTx,
  context: ShowroomContext,
  input: VehicleRequestInput,
): Promise<unknown> {
  const request = await tx.vehicleRequest.create({
    data: {
      tenantId: context.tenantId,
      clientUserId: context.userId,
      preferredMake: input.preferredMake ?? null,
      preferredModel: input.preferredModel ?? null,
      preferredVariant: input.preferredVariant ?? null,
      modelYearMin: input.modelYearMin ?? null,
      modelYearMax: input.modelYearMax ?? null,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      currency: input.currency,
      contactPreference: input.contactPreference,
      notes: input.notes ?? null,
      status: VehicleRequestStatus.PENDING_REVIEW,
    },
    include: vehicleRequestInclude,
  });

  return mapVehicleRequest(request);
}

export async function listClientVehicleRequests(
  tx: ShowroomTx,
  context: ShowroomContext,
): Promise<unknown[]> {
  const requests = await tx.vehicleRequest.findMany({
    where: {
      tenantId: context.tenantId,
      clientUserId: context.userId,
    },
    orderBy: { createdAt: 'desc' },
    include: vehicleRequestInclude,
  });

  return requests.map(mapVehicleRequest);
}

export async function listAdminVehicleRequests(
  tx: ShowroomTx,
  context: ShowroomContext,
  query: { status?: VehicleRequestStatus; page: number; pageSize: number },
): Promise<unknown> {
  assertRequestReviewPermission(context);
  const where = {
    tenantId: context.tenantId,
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    tx.vehicleRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: vehicleRequestInclude,
    }),
    tx.vehicleRequest.count({ where }),
  ]);

  return {
    items: items.map(mapVehicleRequest),
    page: query.page,
    pageSize: query.pageSize,
    total,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

export async function reviewVehicleRequest(
  tx: ShowroomTx,
  context: ShowroomContext,
  requestId: string,
  input: RequestReviewInput,
): Promise<unknown> {
  assertRequestReviewPermission(context);

  const existing = await tx.vehicleRequest.findFirst({
    where: {
      tenantId: context.tenantId,
      id: requestId,
    },
  });

  if (!existing) {
    throw new ShowroomHttpError(404, 'showroom.error.requestNotFound');
  }

  if (existing.status !== VehicleRequestStatus.PENDING_REVIEW) {
    throw new ShowroomHttpError(409, 'showroom.error.requestAlreadyReviewed');
  }

  const updated = await tx.vehicleRequest.update({
    where: {
      tenantId_id: {
        tenantId: context.tenantId,
        id: requestId,
      },
    },
    data: {
      status: input.status,
      decisionNote: input.decisionNote ?? null,
      reviewerUserId: context.userId,
      reviewedAt: new Date(),
    },
    include: vehicleRequestInclude,
  });

  return mapVehicleRequest(updated);
}

async function getManageableListing(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
) {
  const listing = await tx.carListing.findFirst({
    where: {
      tenantId: context.tenantId,
      id: listingId,
      status: {
        not: CarListingStatus.DELETED,
      },
    },
  });

  if (!listing) {
    throw new ShowroomHttpError(404, 'showroom.error.listingNotFound');
  }

  if (listing.sellerUserId !== context.userId && !canAdminShowroom(context)) {
    throw new ShowroomHttpError(403, 'showroom.error.accessDenied');
  }

  return listing;
}

async function assertTaxonomyHierarchy(
  tx: ShowroomTx,
  tenantId: string,
  makeId: string,
  modelId: string,
  variantId: string,
): Promise<void> {
  const variant = await tx.carVariant.findFirst({
    where: {
      tenantId,
      id: variantId,
      modelId,
      model: {
        makeId,
      },
      isActive: true,
    },
  });

  if (!variant) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', {
      variantId: 'showroom.error.invalidTaxonomy',
    });
  }
}

async function assertActiveListingLimit(
  tx: ShowroomTx,
  tenantId: string,
  sellerUserId: string,
): Promise<void> {
  const activeCount = await countActiveListings(tx, tenantId, sellerUserId);

  if (activeCount >= 5) {
    throw new ShowroomHttpError(400, 'showroom.error.activeListingLimit', {
      status: 'showroom.error.activeListingLimit',
    });
  }
}

function assertRequestReviewPermission(context: ShowroomContext): void {
  if (
    !context.permissions.has(SHOWROOM_PERMISSIONS.requestReview) &&
    !context.permissions.has(SHOWROOM_PERMISSIONS.adminManage)
  ) {
    throw new ShowroomHttpError(403, 'showroom.error.accessDenied');
  }
}

async function countActiveListings(
  tx: ShowroomTx,
  tenantId: string,
  sellerUserId: string,
): Promise<number> {
  return tx.carListing.count({
    where: {
      tenantId,
      sellerUserId,
      status: CarListingStatus.ACTIVE,
    },
  });
}

function buildSearchWhere(tenantId: string, query: SearchQuery): Prisma.CarListingWhereInput {
  return {
    tenantId,
    status: CarListingStatus.ACTIVE,
    ...(query.makeId ? { makeId: query.makeId } : {}),
    ...(query.modelId ? { modelId: query.modelId } : {}),
    ...(query.variantId ? { variantId: query.variantId } : {}),
    ...(query.condition ? { condition: query.condition } : {}),
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

function buildSearchOrder(sort: SearchQuery['sort']): Prisma.CarListingOrderByWithRelationInput[] {
  switch (sort) {
    case 'priceAsc':
      return [{ price: 'asc' }, { updatedAt: 'desc' }];
    case 'priceDesc':
      return [{ price: 'desc' }, { updatedAt: 'desc' }];
    case 'yearDesc':
      return [{ modelYear: 'desc' }, { updatedAt: 'desc' }];
    case 'mileageAsc':
      return [{ mileage: 'asc' }, { updatedAt: 'desc' }];
    case 'newest':
      return [{ publishedAt: 'desc' }, { updatedAt: 'desc' }];
  }
}

function createSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `${normalized || 'listing'}-${randomUUID().slice(0, 8)}`;
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, unknown] => entry[1] !== undefined),
  ) as T;
}
