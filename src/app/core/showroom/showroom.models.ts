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
}

export interface ShowroomTaxonomy {
  makes: ShowroomMake[];
  colors: ShowroomColor[];
  bodyTypes: CarBodyType[];
  fuelTypes: CarFuelType[];
  transmissions: CarTransmissionType[];
  conditions: CarListingCondition[];
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
  primaryImage?: ListingImageDto | null;
  imageCount: number;
  updatedAt: string;
}

export interface ListingDetailDto extends ListingSummaryDto {
  vin?: string | null;
  exteriorColorName?: string | null;
  interiorColorName?: string | null;
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
