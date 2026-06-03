export type CarListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'REJECTED'
  | 'SOLD'
  | 'ARCHIVED'
  | 'DELETED';

export type CarListingCondition = 'NEW' | 'CERTIFIED_PRE_OWNED' | 'USED' | 'DAMAGED';
export type CarFuelType =
  | 'PETROL'
  | 'DIESEL'
  | 'HYBRID'
  | 'PLUG_IN_HYBRID'
  | 'ELECTRIC'
  | 'LPG'
  | 'OTHER';
export type CarTransmissionType = 'AUTOMATIC' | 'MANUAL' | 'CVT' | 'DUAL_CLUTCH' | 'OTHER';
export type CarBodyType =
  | 'SEDAN'
  | 'SUV'
  | 'COUPE'
  | 'HATCHBACK'
  | 'CONVERTIBLE'
  | 'WAGON'
  | 'PICKUP'
  | 'VAN'
  | 'CROSSOVER'
  | 'OTHER';
export type VehicleRequestStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ShowroomTaxonomyItem {
  id: string;
  name: string;
}

export interface ShowroomMake extends ShowroomTaxonomyItem {
  country?: string | null;
  models?: ShowroomModel[];
}

export interface ShowroomModel extends ShowroomTaxonomyItem {
  makeId: string;
  productionFrom?: number | null;
  productionTo?: number | null;
  variants?: ShowroomVariant[];
}

export interface ShowroomVariant extends ShowroomTaxonomyItem {
  modelId: string;
  bodyType: CarBodyType;
  fuelType: CarFuelType;
  transmission: CarTransmissionType;
  driveTrain?: string | null;
}

export interface ShowroomColor extends ShowroomTaxonomyItem {
  hexCode?: string | null;
  localizedNames?: Record<string, string>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface VehicleDefinitionCatalogItem extends ShowroomTaxonomyItem {
  code?: string | null;
  description?: string | null;
  localizedNames?: Record<string, string>;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleColorDefinition extends ShowroomColor {
  localizedNames?: Record<string, string>;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMakeDefinition extends ShowroomMake {
  normalizedName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminModelDefinition extends ShowroomModel {
  normalizedName: string;
  isActive: boolean;
  make?: Pick<ShowroomMake, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTrimDefinition extends ShowroomVariant {
  normalizedName: string;
  engineId?: string | null;
  transmissionId?: string | null;
  fuelTypeId?: string | null;
  bodyTypeId?: string | null;
  engine?: VehicleDefinitionCatalogItem | null;
  transmissionCatalog?: VehicleDefinitionCatalogItem | null;
  fuelTypeCatalog?: VehicleDefinitionCatalogItem | null;
  bodyTypeCatalog?: VehicleDefinitionCatalogItem | null;
  isActive: boolean;
  model?: Pick<ShowroomModel, 'id' | 'name'> & { make?: Pick<ShowroomMake, 'id' | 'name'> };
  createdAt: string;
  updatedAt: string;
}

export type VehicleDefinitionEntity =
  | 'makes'
  | 'models'
  | 'trims'
  | 'engines'
  | 'transmissions'
  | 'fuel-types'
  | 'body-types'
  | 'conditions'
  | 'exterior-colors'
  | 'interior-colors';

export type VehicleDefinitionRecord =
  | AdminMakeDefinition
  | AdminModelDefinition
  | AdminTrimDefinition
  | VehicleDefinitionCatalogItem
  | VehicleColorDefinition;

export interface VehicleDefinitionQueryParams {
  q?: string;
  includeInactive?: boolean;
}

export interface VehicleDefinitionInputDto {
  name: string;
  country?: string | null;
  makeId?: string;
  modelId?: string;
  productionFrom?: number | null;
  productionTo?: number | null;
  engineId?: string | null;
  transmissionId?: string | null;
  fuelTypeId?: string | null;
  bodyTypeId?: string | null;
  bodyType?: CarBodyType;
  fuelType?: CarFuelType;
  transmission?: CarTransmissionType;
  driveTrain?: string | null;
  code?: string | null;
  description?: string | null;
  hexCode?: string | null;
  localizedNames?: Record<string, string>;
  localizedNameEn?: string | null;
  localizedNameAr?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminUserRolesDto {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; name: string; description?: string | null; isSystem: boolean }[];
}

export interface UsersRolesQueryParams {
  q?: string;
  role?: string;
  state?: 'active' | 'disabled' | 'all';
}

export interface ShowroomTaxonomy {
  makes: ShowroomMake[];
  colors: ShowroomColor[];
  exteriorColors: VehicleColorDefinition[];
  interiorColors: VehicleColorDefinition[];
  bodyTypes: VehicleDefinitionCatalogItem[];
  fuelTypes: VehicleDefinitionCatalogItem[];
  transmissions: VehicleDefinitionCatalogItem[];
  engines: VehicleDefinitionCatalogItem[];
  conditions: VehicleDefinitionCatalogItem[];
}

export interface ListingImageDto {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  sortOrder: number;
  isPrimary: boolean;
  altText?: string | null;
}

export interface ListingSummaryDto {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  modelYear: number;
  mileage: number;
  condition: CarListingCondition;
  status: CarListingStatus;
  location: string;
  make: ShowroomMake;
  model: ShowroomModel;
  variant: ShowroomVariant;
  exteriorColorId?: string | null;
  interiorColorId?: string | null;
  exteriorColorName?: string | null;
  interiorColorName?: string | null;
  primaryImage?: ListingImageDto | null;
  imageCount: number;
  updatedAt: string;
}

export interface ListingDetailDto extends ListingSummaryDto {
  vin?: string | null;
  description: string;
  seller?: { id: string; displayName: string } | null;
  images: ListingImageDto[];
  priceHistory: { id: string; oldPrice: number; newPrice: number; currency: string; reason?: string | null; createdAt: string }[];
  modelHistory: { id: string; diff: unknown; reason?: string | null; createdAt: string }[];
  createdAt: string;
}

export interface ListingSearchParams {
  q?: string;
  makeId?: string;
  modelId?: string;
  variantId?: string;
  bodyType?: CarBodyType;
  fuelType?: CarFuelType;
  transmission?: CarTransmissionType;
  condition?: CarListingCondition;
  color?: string;
  location?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'yearDesc' | 'mileageAsc';
  page?: number;
  pageSize?: number;
}

export interface ListingSearchResult {
  items: ListingSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface ListingInputDto {
  makeId: string;
  modelId: string;
  variantId: string;
  title: string;
  modelYear: number;
  price: number;
  currency: string;
  mileage: number;
  condition: CarListingCondition;
  location: string;
  description: string;
  exteriorColorName?: string | null;
  interiorColorName?: string | null;
  status?: CarListingStatus;
}

export interface ClientListingsDto {
  activeCount: number;
  activeLimit: number;
  items: ListingSummaryDto[];
}

export interface VehicleInventoryCountersDto {
  newCars: number;
  usedCars: number;
  cachedAt: string;
}

export interface AdminVehicleListParams {
  q?: string;
  status?: CarListingStatus;
  condition?: CarListingCondition;
  page?: number;
  pageSize?: number;
}

export interface AdminVehicleListResult {
  items: ListingSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  counters: VehicleInventoryCountersDto;
}

export interface AdminVehicleInputDto extends ListingInputDto {
  vin?: string | null;
  exteriorColorId?: string | null;
  interiorColorId?: string | null;
  exteriorColorName?: string | null;
  interiorColorName?: string | null;
  priceChangeReason?: string;
  modelChangeReason?: string;
}

export interface AdminVehicleImageQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'succeeded' | 'failed';
  progress: number;
  error?: string;
}

export interface VehicleRequestDto {
  id: string;
  preferredMake?: string | null;
  preferredModel?: string | null;
  preferredVariant?: string | null;
  modelYearMin?: number | null;
  modelYearMax?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string;
  contactPreference: string;
  notes?: string | null;
  status: VehicleRequestStatus;
  decisionNote?: string | null;
  client?: { id: string; displayName: string; email: string; phone?: string | null } | null;
  reviewer?: { id: string; displayName: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRequestInputDto {
  preferredMake?: string | null;
  preferredModel?: string | null;
  preferredVariant?: string | null;
  modelYearMin?: number | null;
  modelYearMax?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string;
  contactPreference: 'email' | 'phone' | 'whatsapp';
  notes?: string | null;
}

export interface AdminRequestResult {
  items: VehicleRequestDto[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
