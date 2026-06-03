import type {
  CarListing,
  CarListingImage,
  CarMake,
  CarModel,
  CarModelHistory,
  CarPriceHistory,
  CarVariant,
  VehicleBodyType,
  VehicleCondition,
  VehicleEngine,
  VehicleExteriorColor,
  VehicleFuelType,
  VehicleInteriorColor,
  VehicleTransmission,
  User,
  VehicleRequest,
} from '../../generated/prisma/client';
import { showroomConfig } from './config';

type ListingWithDetails = CarListing & {
  make: CarMake;
  model: CarModel;
  variant: CarVariant;
  seller?: Pick<User, 'id' | 'displayName'>;
  images: CarListingImage[];
  priceHistory?: CarPriceHistory[];
  modelHistory?: CarModelHistory[];
};

type RequestWithUsers = VehicleRequest & {
  client?: Pick<User, 'id' | 'displayName' | 'email' | 'phone'>;
  reviewer?: Pick<User, 'id' | 'displayName'> | null;
};

export function mapListingSummary(listing: ListingWithDetails): Record<string, unknown> {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    price: Number(listing.price),
    currency: listing.currency,
    modelYear: listing.modelYear,
    mileage: listing.mileage,
    condition: listing.condition,
    status: listing.status,
    location: listing.location,
    exteriorColorId: listing.exteriorColorId,
    interiorColorId: listing.interiorColorId,
    exteriorColorName: listing.exteriorColorName,
    interiorColorName: listing.interiorColorName,
    make: mapMake(listing.make),
    model: mapModel(listing.model),
    variant: mapVariant(listing.variant),
    primaryImage: mapImage(listing.images.find((image) => image.isPrimary) ?? listing.images[0]),
    imageCount: listing.images.length,
    updatedAt: listing.updatedAt.toISOString(),
  };
}

export function mapListingDetail(listing: ListingWithDetails): Record<string, unknown> {
  return {
    ...mapListingSummary(listing),
    vin: listing.vin,
    exteriorColorId: listing.exteriorColorId,
    interiorColorId: listing.interiorColorId,
    exteriorColorName: listing.exteriorColorName,
    interiorColorName: listing.interiorColorName,
    description: listing.description,
    seller: listing.seller
      ? {
          id: listing.seller.id,
          displayName: listing.seller.displayName,
        }
      : null,
    images: listing.images.map(mapImage).filter(Boolean),
    priceHistory: (listing.priceHistory ?? []).map((history) => ({
      id: history.id,
      oldPrice: Number(history.oldPrice),
      newPrice: Number(history.newPrice),
      currency: history.currency,
      reason: history.reason,
      createdAt: history.createdAt.toISOString(),
    })),
    modelHistory: (listing.modelHistory ?? []).map((history) => ({
      id: history.id,
      diff: history.diff,
      reason: history.reason,
      createdAt: history.createdAt.toISOString(),
    })),
    createdAt: listing.createdAt.toISOString(),
  };
}

export function mapImage(image: CarListingImage | undefined): Record<string, unknown> | null {
  if (!image) {
    return null;
  }

  return {
    id: image.id,
    url: `${showroomConfig.mediaUrlBase}/${encodeURIComponent(image.storageKey)}`,
    originalName: image.originalName,
    mimeType: image.mimeType,
    byteSize: image.byteSize,
    width: image.width,
    height: image.height,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    altText: image.altText,
  };
}

export function mapMake(make: CarMake): Record<string, unknown> {
  return {
    id: make.id,
    name: make.name,
    country: make.country,
  };
}

export function mapModel(model: CarModel): Record<string, unknown> {
  return {
    id: model.id,
    makeId: model.makeId,
    name: model.name,
    productionFrom: model.productionFrom,
    productionTo: model.productionTo,
  };
}

export function mapVariant(variant: CarVariant): Record<string, unknown> {
  return {
    id: variant.id,
    modelId: variant.modelId,
    name: variant.name,
    engineId: 'engineId' in variant ? variant.engineId : null,
    transmissionId: 'transmissionId' in variant ? variant.transmissionId : null,
    fuelTypeId: 'fuelTypeId' in variant ? variant.fuelTypeId : null,
    bodyTypeId: 'bodyTypeId' in variant ? variant.bodyTypeId : null,
    bodyType: variant.bodyType,
    fuelType: variant.fuelType,
    transmission: variant.transmission,
    driveTrain: variant.driveTrain,
  };
}

export function mapVehicleDefinitionCatalog(
  item: VehicleEngine | VehicleTransmission | VehicleFuelType | VehicleBodyType | VehicleCondition,
): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    description: item.description,
    localizedNames: item.localizedNames,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function mapVehicleColorDefinition(
  item: VehicleExteriorColor | VehicleInteriorColor,
): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    hexCode: item.hexCode,
    localizedNames: item.localizedNames,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function mapAdminUserRoles(user: {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: { role: { id: string; name: string; description: string | null; isSystem: boolean } }[];
}): Record<string, unknown> {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    })),
  };
}

export function mapVehicleRequest(request: RequestWithUsers): Record<string, unknown> {
  return {
    id: request.id,
    preferredMake: request.preferredMake,
    preferredModel: request.preferredModel,
    preferredVariant: request.preferredVariant,
    modelYearMin: request.modelYearMin,
    modelYearMax: request.modelYearMax,
    budgetMin: request.budgetMin === null ? null : Number(request.budgetMin),
    budgetMax: request.budgetMax === null ? null : Number(request.budgetMax),
    currency: request.currency,
    contactPreference: request.contactPreference,
    notes: request.notes,
    status: request.status,
    decisionNote: request.decisionNote,
    client: request.client
      ? {
          id: request.client.id,
          displayName: request.client.displayName,
          email: request.client.email,
          phone: request.client.phone,
        }
      : null,
    reviewer: request.reviewer
      ? {
          id: request.reviewer.id,
          displayName: request.reviewer.displayName,
        }
      : null,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
