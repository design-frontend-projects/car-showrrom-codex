import type {
  AdminVehicleImageQueueItem,
  AdminVehicleInputDto,
  CarBodyType,
  CarFuelType,
  CarListingCondition,
  CarListingStatus,
  CarTransmissionType,
  ListingDetailDto,
  VehicleColorDefinition,
} from '../../../core/showroom/showroom.models';

export const ADMIN_FEATURES = [
  'Panoramic roof',
  'Leather seats',
  'Adaptive cruise',
  'Blind spot monitor',
  '360 camera',
  'Apple CarPlay',
  'Heated seats',
  'Premium audio',
] as const;

export interface AdminVehicleFormValue {
  makeId: string;
  modelId: string;
  variantId: string;
  title: string;
  modelYear: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  mileage: number;
  condition: CarListingCondition;
  status: CarListingStatus;
  location: string;
  engine: string;
  transmission: CarTransmissionType | '';
  fuelType: CarFuelType | '';
  bodyType: CarBodyType | '';
  exteriorColorId: string | null;
  interiorColorId: string | null;
  exteriorColorName: string;
  interiorColorName: string;
  features: string[];
  description: string;
}

export interface AdminVehiclePreview {
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  mileage: number;
  condition: CarListingCondition;
  status: CarListingStatus;
  location: string;
  features: string[];
  exteriorColorName?: string;
  interiorColorName?: string;
  imageUrl?: string | null;
}

export const SUPPORTED_ADMIN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_ADMIN_IMAGE_BYTES = 5 * 1024 * 1024;

export function buildAdminVehiclePayload(value: AdminVehicleFormValue): AdminVehicleInputDto {
  return {
    makeId: value.makeId,
    modelId: value.modelId,
    variantId: value.variantId,
    title: value.title.trim(),
    modelYear: Number(value.modelYear),
    price: Number(value.salePrice),
    currency: 'USD',
    mileage: Number(value.mileage),
    condition: value.condition,
    location: value.location.trim(),
    description: composeAdminDescription(value),
    exteriorColorId: value.exteriorColorId || null,
    interiorColorId: value.interiorColorId || null,
    exteriorColorName: value.exteriorColorName.trim() || null,
    interiorColorName: value.interiorColorName.trim() || null,
    status: value.status,
  };
}

export function composeAdminDescription(value: AdminVehicleFormValue): string {
  const details = [
    value.description.trim(),
    value.engine.trim() ? `Engine: ${value.engine.trim()}` : '',
    value.fuelType ? `Fuel: ${formatEnum(value.fuelType)}` : '',
    value.transmission ? `Transmission: ${formatEnum(value.transmission)}` : '',
    value.bodyType ? `Body: ${formatEnum(value.bodyType)}` : '',
    value.features.length > 0 ? `Features: ${value.features.join(', ')}` : '',
  ].filter(Boolean);

  return details.join('\n\n');
}

export function buildPreview(
  value: AdminVehicleFormValue,
  labels: { make?: string; model?: string; variant?: string },
  imageUrl?: string | null,
): AdminVehiclePreview {
  return {
    title: value.title.trim() || 'Untitled vehicle',
    subtitle: [labels.make, labels.model, labels.variant, value.modelYear].filter(Boolean).join(' '),
    price: Number(value.salePrice) || 0,
    originalPrice: Number(value.originalPrice) || 0,
    discount: Number(value.discount) || 0,
    mileage: Number(value.mileage) || 0,
    condition: value.condition,
    status: value.status,
    location: value.location.trim() || 'Showroom',
    features: value.features,
    exteriorColorName: value.exteriorColorName,
    interiorColorName: value.interiorColorName,
    imageUrl,
  };
}

export function formValueFromListing(listing: ListingDetailDto): Partial<AdminVehicleFormValue> {
  return {
    makeId: listing.make.id,
    modelId: listing.model.id,
    variantId: listing.variant.id,
    title: listing.title,
    modelYear: listing.modelYear,
    originalPrice: listing.price,
    salePrice: listing.price,
    discount: 0,
    mileage: listing.mileage,
    condition: listing.condition,
    status: listing.status,
    location: listing.location,
    engine: '',
    transmission: listing.variant.transmission,
    fuelType: listing.variant.fuelType,
    bodyType: listing.variant.bodyType,
    exteriorColorId: listing.exteriorColorId ?? null,
    interiorColorId: listing.interiorColorId ?? null,
    exteriorColorName: listing.exteriorColorName ?? '',
    interiorColorName: listing.interiorColorName ?? '',
    features: [],
    description: listing.description,
  };
}

export function validateAdminImageFile(file: File): string | null {
  if (!SUPPORTED_ADMIN_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported image type';
  }

  if (file.size > MAX_ADMIN_IMAGE_BYTES) {
    return 'Image exceeds 5 MB';
  }

  return null;
}

export function createImageQueueItem(
  file: File,
  createObjectUrl: (file: File) => string = (value) => URL.createObjectURL(value),
): AdminVehicleImageQueueItem {
  const error = validateAdminImageFile(file);

  return {
    id: createId(),
    file,
    previewUrl: error ? '' : createObjectUrl(file),
    status: error ? 'failed' : 'pending',
    progress: 0,
    error: error ?? undefined,
  };
}

export function reorderQueue<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);

  return copy;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function vehicleColorLabel(color: VehicleColorDefinition | undefined | null, language = 'en'): string {
  return color?.localizedNames?.[language] || color?.name || '';
}
