import type { Prisma } from '../../generated/prisma/client';
import { randomUUID } from 'node:crypto';
import {
  CarBodyType,
  CarFuelType,
  CarListingCondition,
  CarListingStatus,
  CarTransmissionType,
  VehicleRequestStatus,
} from '../../generated/prisma/client';
import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import { canAdminShowroom, type ShowroomContext } from './auth';
import {
  getCachedVehicleCatalogList,
  getCachedVehicleInventoryCounters,
  invalidateVehicleCatalogCache,
  invalidateVehicleInventoryCounters,
} from './cache';
import { showroomConfig } from './config';
import {
  mapAdminUserRoles,
  mapImage,
  mapListingDetail,
  mapListingSummary,
  mapMake,
  mapModel,
  mapVariant,
  mapVehicleDefinitionCatalog,
  mapVehicleRequest,
} from './dto';
import { ShowroomHttpError } from './errors';
import {
  adminListingPreviewInclude,
  buildAdminListingWhere,
  findAdminListingById,
  listingDetailInclude,
  listingFullInclude,
  type ShowroomTx,
  vehicleRequestInclude,
} from './repositories';
import {
  type AdminVehicleInput,
  type AdminVehicleQuery,
  type AdminVehicleUpdateInput,
  type CatalogDefinitionInput,
  type ListingInput,
  type ListingUpdateInput,
  type MakeDefinitionInput,
  type ModelDefinitionInput,
  type RequestReviewInput,
  type SearchQuery,
  type TrimDefinitionInput,
  type UsersRolesQuery,
  type VehicleDefinitionEntity,
  type VehicleDefinitionQuery,
  type VehicleRequestInput,
} from './validation';

export async function listTaxonomy(tx: ShowroomTx, tenantId: string): Promise<unknown> {
  return getCachedVehicleCatalogList(tenantId, 'taxonomy', async () => {
  const [makes, colors, bodyTypes, fuelTypes, transmissions, engines, conditions] = await Promise.all([
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
    tx.vehicleBodyType.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    tx.vehicleFuelType.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    tx.vehicleTransmission.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    tx.vehicleEngine.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    tx.vehicleCondition.findMany({ where: { tenantId, isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
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
    bodyTypes: bodyTypes.map(mapVehicleDefinitionCatalog),
    fuelTypes: fuelTypes.map(mapVehicleDefinitionCatalog),
    transmissions: transmissions.map(mapVehicleDefinitionCatalog),
    engines: engines.map(mapVehicleDefinitionCatalog),
    conditions: conditions.map(mapVehicleDefinitionCatalog),
  };
  });
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

export async function listUsersAndRoles(
  tx: ShowroomTx,
  context: ShowroomContext,
  query: UsersRolesQuery,
): Promise<unknown[]> {
  assertAdminVehiclePermission(context);

  const users = await tx.user.findMany({
    where: {
      tenantId: context.tenantId,
      ...(query.state === 'active' ? { isActive: true } : {}),
      ...(query.state === 'disabled' ? { isActive: false } : {}),
      ...(query.role
        ? {
            roles: {
              some: {
                role: {
                  name: query.role,
                },
              },
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' } },
              { displayName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
    include: {
      roles: {
        include: {
          role: true,
        },
        orderBy: {
          role: {
            name: 'asc',
          },
        },
      },
    },
  });

  return users.map(mapAdminUserRoles);
}

export async function listVehicleDefinitions(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: VehicleDefinitionEntity,
  query: VehicleDefinitionQuery,
): Promise<unknown[]> {
  assertAdminVehiclePermission(context);

  return getCachedVehicleCatalogList(context.tenantId, `definitions:${entity}:${JSON.stringify(query)}`, async () => {
    switch (entity) {
      case 'makes':
        return (
          await tx.carMake.findMany({
            where: definitionWhere(context.tenantId, query),
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
          })
        ).map(mapMakeDefinition);
      case 'models':
        return (
          await tx.carModel.findMany({
            where: definitionWhere(context.tenantId, query),
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
            include: { make: true },
          })
        ).map(mapModelDefinition);
      case 'trims':
        return (
          await tx.carVariant.findMany({
            where: definitionWhere(context.tenantId, query),
            orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
            include: { model: { include: { make: true } }, engine: true, transmissionCatalog: true, fuelTypeCatalog: true, bodyTypeCatalog: true },
          })
        ).map(mapTrimDefinition);
      case 'engines':
      case 'transmissions':
      case 'fuel-types':
      case 'body-types':
      case 'conditions':
        return (await catalogDelegate(tx, entity).findMany({
          where: definitionWhere(context.tenantId, query),
          orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        })).map(mapVehicleDefinitionCatalog);
    }
  });
}

export async function createVehicleDefinition(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: VehicleDefinitionEntity,
  input: MakeDefinitionInput | ModelDefinitionInput | TrimDefinitionInput | CatalogDefinitionInput,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  const created = await writeVehicleDefinition(tx, context, entity, input);
  await recordDefinitionAudit(tx, context, `${entity}.created`, entity, readId(created), input);
  invalidateVehicleCatalogCache(context.tenantId);

  return created;
}

export async function updateVehicleDefinition(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: VehicleDefinitionEntity,
  id: string,
  input: Partial<MakeDefinitionInput | ModelDefinitionInput | TrimDefinitionInput | CatalogDefinitionInput>,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  const updated = await writeVehicleDefinition(tx, context, entity, input, id);
  await recordDefinitionAudit(tx, context, `${entity}.updated`, entity, id, input);
  invalidateVehicleCatalogCache(context.tenantId);

  return updated;
}

export async function deactivateVehicleDefinition(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: VehicleDefinitionEntity,
  id: string,
): Promise<void> {
  assertAdminVehiclePermission(context);

  switch (entity) {
    case 'makes':
      await tx.carMake.update({ where: { tenantId_id: { tenantId: context.tenantId, id } }, data: { isActive: false } });
      break;
    case 'models':
      await tx.carModel.update({ where: { tenantId_id: { tenantId: context.tenantId, id } }, data: { isActive: false } });
      break;
    case 'trims':
      await tx.carVariant.update({ where: { tenantId_id: { tenantId: context.tenantId, id } }, data: { isActive: false } });
      break;
    case 'engines':
    case 'transmissions':
    case 'fuel-types':
    case 'body-types':
    case 'conditions':
      await catalogDelegate(tx, entity).update({ where: { tenantId_id: { tenantId: context.tenantId, id } }, data: { isActive: false } });
      break;
  }

  await recordDefinitionAudit(tx, context, `${entity}.deactivated`, entity, id, {});
  invalidateVehicleCatalogCache(context.tenantId);
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
  return createListingForActor(tx, context, input, { enforceActiveLimit: true });
}

export async function listAdminVehicles(
  tx: ShowroomTx,
  context: ShowroomContext,
  query: AdminVehicleQuery,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  const where = buildAdminListingWhere(context.tenantId, query);
  const skip = (query.page - 1) * query.pageSize;
  const [items, total, counters] = await Promise.all([
    tx.carListing.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: query.pageSize,
      include: listingDetailInclude,
    }),
    tx.carListing.count({ where }),
    getCachedVehicleInventoryCounters(tx, context.tenantId),
  ]);

  return {
    items: items.map(mapListingSummary),
    page: query.page,
    pageSize: query.pageSize,
    total,
    pageCount: Math.ceil(total / query.pageSize),
    counters,
  };
}

export async function getAdminVehicle(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  const listing = await findAdminListingById(tx, context.tenantId, listingId);

  if (!listing) {
    throw new ShowroomHttpError(404, 'showroom.error.listingNotFound');
  }

  return mapListingDetail(listing);
}

export async function createAdminVehicle(
  tx: ShowroomTx,
  context: ShowroomContext,
  input: AdminVehicleInput,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  return createListingForActor(tx, context, input, { enforceActiveLimit: false });
}

export async function updateAdminVehicle(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  input: AdminVehicleUpdateInput,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  return updateListing(tx, context, listingId, input);
}

export async function transitionAdminVehicleStatus(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  status: CarListingStatus,
): Promise<unknown> {
  assertAdminVehiclePermission(context);
  return transitionListingStatus(tx, context, listingId, status, { enforceActiveLimit: false });
}

export async function getVehicleInventoryCounters(
  tx: ShowroomTx,
  tenantId: string,
): Promise<unknown> {
  return getCachedVehicleInventoryCounters(tx, tenantId);
}

async function createListingForActor(
  tx: ShowroomTx,
  context: ShowroomContext,
  input: ListingInput,
  options: { enforceActiveLimit: boolean },
): Promise<unknown> {
  await assertTaxonomyHierarchy(tx, context.tenantId, input.makeId, input.modelId, input.variantId);

  const status = input.status ?? CarListingStatus.DRAFT;

  if (status === CarListingStatus.ACTIVE && options.enforceActiveLimit) {
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

  invalidateVehicleInventoryCounters(context.tenantId);

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
      publishedAt:
        input.status === CarListingStatus.ACTIVE && existing.status !== CarListingStatus.ACTIVE
          ? new Date()
          : undefined,
      soldAt: input.status === CarListingStatus.SOLD ? new Date() : undefined,
      archivedAt: input.status === CarListingStatus.ARCHIVED ? new Date() : undefined,
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

  invalidateVehicleInventoryCounters(context.tenantId);

  return mapListingDetail(updated);
}

export async function transitionListingStatus(
  tx: ShowroomTx,
  context: ShowroomContext,
  listingId: string,
  status: CarListingStatus,
  options: { enforceActiveLimit: boolean } = { enforceActiveLimit: true },
): Promise<unknown> {
  const listing = await getManageableListing(tx, context, listingId);

  if (
    status === CarListingStatus.ACTIVE &&
    listing.status !== CarListingStatus.ACTIVE &&
    options.enforceActiveLimit
  ) {
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

  invalidateVehicleInventoryCounters(context.tenantId);

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

  invalidateVehicleInventoryCounters(context.tenantId);
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

  invalidateVehicleInventoryCounters(context.tenantId);

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

  invalidateVehicleInventoryCounters(context.tenantId);

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

  invalidateVehicleInventoryCounters(context.tenantId);

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

  invalidateVehicleInventoryCounters(context.tenantId);

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

async function writeVehicleDefinition(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: VehicleDefinitionEntity,
  input: Partial<MakeDefinitionInput | ModelDefinitionInput | TrimDefinitionInput | CatalogDefinitionInput>,
  id?: string,
): Promise<unknown> {
  switch (entity) {
    case 'makes':
      return writeMakeDefinition(tx, context.tenantId, input as Partial<MakeDefinitionInput>, id);
    case 'models':
      return writeModelDefinition(tx, context.tenantId, input as Partial<ModelDefinitionInput>, id);
    case 'trims':
      return writeTrimDefinition(tx, context.tenantId, input as Partial<TrimDefinitionInput>, id);
    case 'engines':
    case 'transmissions':
    case 'fuel-types':
    case 'body-types':
    case 'conditions':
      return writeCatalogDefinition(tx, context.tenantId, entity, input as Partial<CatalogDefinitionInput>, id);
  }
}

async function writeMakeDefinition(
  tx: ShowroomTx,
  tenantId: string,
  input: Partial<MakeDefinitionInput>,
  id?: string,
): Promise<unknown> {
  const data = removeUndefined({
    name: input.name,
    normalizedName: input.name ? normalizeDefinitionName(input.name) : undefined,
    country: input.country,
    isActive: input.isActive,
  });

  if (id) {
    const make = await tx.carMake.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });

    return mapMakeDefinition(make);
  }

  const name = requireDefinitionName(input.name);
  const make = await tx.carMake.create({
    data: {
      tenantId,
      name,
      normalizedName: normalizeDefinitionName(name),
      country: input.country ?? null,
      isActive: input.isActive ?? true,
    },
  });

  return mapMakeDefinition(make);
}

async function writeModelDefinition(
  tx: ShowroomTx,
  tenantId: string,
  input: Partial<ModelDefinitionInput>,
  id?: string,
): Promise<unknown> {
  const makeId = input.makeId ?? (id ? undefined : null);

  if (makeId) {
    await assertMakeBelongsToTenant(tx, tenantId, makeId);
  }

  const data = removeUndefined({
    makeId: input.makeId,
    name: input.name,
    normalizedName: input.name ? normalizeDefinitionName(input.name) : undefined,
    productionFrom: input.productionFrom,
    productionTo: input.productionTo,
    isActive: input.isActive,
  });

  if (id) {
    const model = await tx.carModel.update({
      where: { tenantId_id: { tenantId, id } },
      data,
      include: { make: true },
    });

    return mapModelDefinition(model);
  }

  const name = requireDefinitionName(input.name);
  const model = await tx.carModel.create({
    data: {
      tenantId,
      makeId: requireValue(input.makeId, 'makeId'),
      name,
      normalizedName: normalizeDefinitionName(name),
      productionFrom: input.productionFrom ?? null,
      productionTo: input.productionTo ?? null,
      isActive: input.isActive ?? true,
    },
    include: { make: true },
  });

  return mapModelDefinition(model);
}

async function writeTrimDefinition(
  tx: ShowroomTx,
  tenantId: string,
  input: Partial<TrimDefinitionInput>,
  id?: string,
): Promise<unknown> {
  const modelId = input.modelId ?? (id ? undefined : null);

  if (modelId) {
    await assertModelBelongsToTenant(tx, tenantId, modelId);
  }

  const catalogEnums = await resolveTrimCatalogEnums(tx, tenantId, input);
  const data = removeUndefined({
    modelId: input.modelId,
    engineId: input.engineId,
    transmissionId: input.transmissionId,
    fuelTypeId: input.fuelTypeId,
    bodyTypeId: input.bodyTypeId,
    name: input.name,
    normalizedName: input.name ? normalizeDefinitionName(input.name) : undefined,
    bodyType: input.bodyType ?? catalogEnums.bodyType,
    fuelType: input.fuelType ?? catalogEnums.fuelType,
    transmission: input.transmission ?? catalogEnums.transmission,
    driveTrain: input.driveTrain,
    isActive: input.isActive,
  });

  if (id) {
    const trim = await tx.carVariant.update({
      where: { tenantId_id: { tenantId, id } },
      data,
      include: { model: { include: { make: true } }, engine: true, transmissionCatalog: true, fuelTypeCatalog: true, bodyTypeCatalog: true },
    });

    return mapTrimDefinition(trim);
  }

  const name = requireDefinitionName(input.name);
  const trim = await tx.carVariant.create({
    data: {
      tenantId,
      modelId: requireValue(input.modelId, 'modelId'),
      engineId: input.engineId ?? null,
      transmissionId: input.transmissionId ?? null,
      fuelTypeId: input.fuelTypeId ?? null,
      bodyTypeId: input.bodyTypeId ?? null,
      name,
      normalizedName: normalizeDefinitionName(name),
      bodyType: input.bodyType ?? catalogEnums.bodyType ?? CarBodyType.OTHER,
      fuelType: input.fuelType ?? catalogEnums.fuelType ?? CarFuelType.OTHER,
      transmission: input.transmission ?? catalogEnums.transmission ?? CarTransmissionType.OTHER,
      driveTrain: input.driveTrain ?? null,
      isActive: input.isActive ?? true,
    },
    include: { model: { include: { make: true } }, engine: true, transmissionCatalog: true, fuelTypeCatalog: true, bodyTypeCatalog: true },
  });

  return mapTrimDefinition(trim);
}

async function writeCatalogDefinition(
  tx: ShowroomTx,
  tenantId: string,
  entity: VehicleDefinitionEntity,
  input: Partial<CatalogDefinitionInput>,
  id?: string,
): Promise<unknown> {
  const delegate = catalogDelegate(tx, entity);
  const data = removeUndefined({
    name: input.name,
    normalizedName: input.name ? normalizeDefinitionName(input.name) : undefined,
    code: input.code ? normalizeCode(input.code) : input.code,
    description: input.description,
    localizedNames: input.localizedNames,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  });
  if (id) {
    const item = await delegate.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    });

    return mapVehicleDefinitionCatalog(item);
  }

  const name = requireDefinitionName(input.name);
  const item = await delegate.create({
    data: {
      tenantId,
      name,
      normalizedName: normalizeDefinitionName(name),
      code: input.code ? normalizeCode(input.code) : null,
      description: input.description ?? null,
      localizedNames: input.localizedNames ?? {},
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return mapVehicleDefinitionCatalog(item);
}

function definitionWhere(tenantId: string, query: VehicleDefinitionQuery): Record<string, unknown> {
  return {
    tenantId,
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { normalizedName: { contains: normalizeDefinitionName(query.q), mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

function catalogDelegate(tx: ShowroomTx, entity: VehicleDefinitionEntity): any {
  switch (entity) {
    case 'engines':
      return tx.vehicleEngine;
    case 'transmissions':
      return tx.vehicleTransmission;
    case 'fuel-types':
      return tx.vehicleFuelType;
    case 'body-types':
      return tx.vehicleBodyType;
    case 'conditions':
      return tx.vehicleCondition;
    default:
      throw new ShowroomHttpError(400, 'showroom.error.definitionEntity');
  }
}

function mapMakeDefinition(make: { id: string; name: string; normalizedName: string; country: string | null; isActive: boolean; createdAt: Date; updatedAt: Date }): Record<string, unknown> {
  return {
    id: make.id,
    name: make.name,
    normalizedName: make.normalizedName,
    country: make.country,
    isActive: make.isActive,
    createdAt: make.createdAt.toISOString(),
    updatedAt: make.updatedAt.toISOString(),
  };
}

function mapModelDefinition(model: { id: string; makeId: string; name: string; normalizedName: string; productionFrom: number | null; productionTo: number | null; isActive: boolean; createdAt: Date; updatedAt: Date; make?: { id: string; name: string } }): Record<string, unknown> {
  return {
    id: model.id,
    makeId: model.makeId,
    make: model.make ? { id: model.make.id, name: model.make.name } : undefined,
    name: model.name,
    normalizedName: model.normalizedName,
    productionFrom: model.productionFrom,
    productionTo: model.productionTo,
    isActive: model.isActive,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

function mapTrimDefinition(trim: any): Record<string, unknown> {
  return {
    id: trim.id,
    modelId: trim.modelId,
    model: trim.model ? { id: trim.model.id, name: trim.model.name, make: trim.model.make ? { id: trim.model.make.id, name: trim.model.make.name } : undefined } : undefined,
    name: trim.name,
    normalizedName: trim.normalizedName,
    engineId: trim.engineId,
    transmissionId: trim.transmissionId,
    fuelTypeId: trim.fuelTypeId,
    bodyTypeId: trim.bodyTypeId,
    engine: trim.engine ? mapVehicleDefinitionCatalog(trim.engine) : null,
    transmissionCatalog: trim.transmissionCatalog ? mapVehicleDefinitionCatalog(trim.transmissionCatalog) : null,
    fuelTypeCatalog: trim.fuelTypeCatalog ? mapVehicleDefinitionCatalog(trim.fuelTypeCatalog) : null,
    bodyTypeCatalog: trim.bodyTypeCatalog ? mapVehicleDefinitionCatalog(trim.bodyTypeCatalog) : null,
    bodyType: trim.bodyType,
    fuelType: trim.fuelType,
    transmission: trim.transmission,
    driveTrain: trim.driveTrain,
    isActive: trim.isActive,
    createdAt: trim.createdAt.toISOString(),
    updatedAt: trim.updatedAt.toISOString(),
  };
}

async function resolveTrimCatalogEnums(
  tx: ShowroomTx,
  tenantId: string,
  input: Partial<TrimDefinitionInput>,
): Promise<{
  bodyType?: CarBodyType;
  fuelType?: CarFuelType;
  transmission?: CarTransmissionType;
}> {
  const [bodyType, fuelType, transmission] = await Promise.all([
    input.bodyTypeId ? tx.vehicleBodyType.findUnique({ where: { tenantId_id: { tenantId, id: input.bodyTypeId } } }) : null,
    input.fuelTypeId ? tx.vehicleFuelType.findUnique({ where: { tenantId_id: { tenantId, id: input.fuelTypeId } } }) : null,
    input.transmissionId ? tx.vehicleTransmission.findUnique({ where: { tenantId_id: { tenantId, id: input.transmissionId } } }) : null,
  ]);

  if (input.bodyTypeId && !bodyType) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { bodyTypeId: 'showroom.error.invalidTaxonomy' });
  }

  if (input.fuelTypeId && !fuelType) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { fuelTypeId: 'showroom.error.invalidTaxonomy' });
  }

  if (input.transmissionId && !transmission) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { transmissionId: 'showroom.error.invalidTaxonomy' });
  }

  if (input.engineId) {
    const engine = await tx.vehicleEngine.findUnique({ where: { tenantId_id: { tenantId, id: input.engineId } } });

    if (!engine) {
      throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { engineId: 'showroom.error.invalidTaxonomy' });
    }
  }

  return {
    bodyType: readEnumValue(CarBodyType, bodyType?.code),
    fuelType: readEnumValue(CarFuelType, fuelType?.code),
    transmission: readEnumValue(CarTransmissionType, transmission?.code),
  };
}

async function assertMakeBelongsToTenant(tx: ShowroomTx, tenantId: string, makeId: string): Promise<void> {
  const make = await tx.carMake.findUnique({ where: { tenantId_id: { tenantId, id: makeId } }, select: { id: true } });

  if (!make) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { makeId: 'showroom.error.invalidTaxonomy' });
  }
}

async function assertModelBelongsToTenant(tx: ShowroomTx, tenantId: string, modelId: string): Promise<void> {
  const model = await tx.carModel.findUnique({ where: { tenantId_id: { tenantId, id: modelId } }, select: { id: true } });

  if (!model) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidTaxonomy', { modelId: 'showroom.error.invalidTaxonomy' });
  }
}

async function recordDefinitionAudit(
  tx: ShowroomTx,
  context: ShowroomContext,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: unknown,
): Promise<void> {
  await tx.rbacAuditEvent.create({
    data: {
      tenantId: context.tenantId,
      actorUserId: context.userId,
      action: `vehicle-definition.${action}`,
      targetType,
      targetId,
      metadata: sanitizeAuditMetadata(metadata),
    },
  });
}

function sanitizeAuditMetadata(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditMetadata(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/(password|hash|token|otp|secret|backup|csrf|session)/i.test(key))
        .map(([key, item]) => [key, sanitizeAuditMetadata(item)]),
    );
  }

  return {};
}

function normalizeDefinitionName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function requireDefinitionName(value: string | undefined): string {
  if (!value?.trim()) {
    throw new ShowroomHttpError(400, 'showroom.error.validation', { name: 'showroom.validation.required' });
  }

  return value.trim();
}

function requireValue(value: string | null | undefined, field: string): string {
  if (!value) {
    throw new ShowroomHttpError(400, 'showroom.error.validation', { [field]: 'showroom.validation.required' });
  }

  return value;
}

function readId(value: unknown): string | null {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string' ? value.id : null;
}

function readEnumValue<T extends Record<string, string>>(enumObject: T, value: string | null | undefined): T[keyof T] | undefined {
  return value && Object.values(enumObject).includes(value) ? (value as T[keyof T]) : undefined;
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

function assertAdminVehiclePermission(context: ShowroomContext): void {
  if (!canAdminShowroom(context)) {
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
