import { z } from 'zod';
import {
  CarBodyType,
  CarFuelType,
  CarListingCondition,
  CarListingStatus,
  CarTransmissionType,
  VehicleRequestStatus,
} from '../../generated/prisma/client';
import { ShowroomHttpError } from './errors';

const uuidSchema = z.string().uuid();
const textSchema = z.string().trim().min(1).max(200);
const optionalTextSchema = z.string().trim().max(500).optional().nullable();
const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'showroom.validation.hexColor')
  .optional()
  .nullable();
const moneySchema = z.coerce.number().finite().min(0).max(99_999_999);
const yearSchema = z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2);
const mileageSchema = z.coerce.number().int().min(0).max(5_000_000);
const localizedNamesSchema = z.record(z.string().min(2).max(12), z.string().trim().min(1).max(200)).default({});

export const vehicleDefinitionEntitySchema = z.enum([
  'makes',
  'models',
  'trims',
  'engines',
  'transmissions',
  'fuel-types',
  'body-types',
  'conditions',
  'exterior-colors',
  'interior-colors',
]);

export const inventoryScopeSchema = z.enum(['new', 'used']);
export const optionQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  includeInactive: z.coerce.boolean().default(false),
  selectedId: uuidSchema.optional(),
  makeId: uuidSchema.optional(),
  modelId: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const searchQuerySchema = z
  .object({
    inventoryScope: inventoryScopeSchema.optional(),
    q: z.string().trim().max(120).optional(),
    makeId: uuidSchema.optional(),
    modelId: uuidSchema.optional(),
    variantId: uuidSchema.optional(),
    bodyType: z.enum(CarBodyType).optional(),
    fuelType: z.enum(CarFuelType).optional(),
    transmission: z.enum(CarTransmissionType).optional(),
    condition: z.enum(CarListingCondition).optional(),
    color: z.string().trim().max(60).optional(),
    location: z.string().trim().max(120).optional(),
    minYear: yearSchema.optional(),
    maxYear: yearSchema.optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    minMileage: mileageSchema.optional(),
    maxMileage: mileageSchema.optional(),
    sort: z.enum(['newest', 'priceAsc', 'priceDesc', 'yearDesc', 'mileageAsc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine((value) => !value.minYear || !value.maxYear || value.minYear <= value.maxYear, {
    path: ['maxYear'],
    message: 'showroom.validation.range',
  })
  .refine((value) => !value.minPrice || !value.maxPrice || value.minPrice <= value.maxPrice, {
    path: ['maxPrice'],
    message: 'showroom.validation.range',
  })
  .refine(
    (value) => !value.minMileage || !value.maxMileage || value.minMileage <= value.maxMileage,
    {
      path: ['maxMileage'],
      message: 'showroom.validation.range',
    },
  );

export const listingInputSchema = z.object({
  makeId: uuidSchema,
  modelId: uuidSchema,
  variantId: uuidSchema,
  exteriorColorId: uuidSchema.optional().nullable(),
  interiorColorId: uuidSchema.optional().nullable(),
  title: textSchema.max(160),
  vin: z.string().trim().max(32).optional().nullable(),
  modelYear: yearSchema,
  price: moneySchema.refine((value) => value > 0, 'showroom.validation.price'),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('USD'),
  mileage: mileageSchema,
  condition: z.enum(CarListingCondition),
  exteriorColorName: optionalTextSchema,
  interiorColorName: optionalTextSchema,
  location: textSchema.max(120),
  description: z.string().trim().min(20).max(5000),
  status: z.enum(CarListingStatus).optional(),
});

export const listingUpdateSchema = listingInputSchema.partial().extend({
  priceChangeReason: z.string().trim().max(300).optional(),
  modelChangeReason: z.string().trim().max(300).optional(),
});

export const listingStatusSchema = z.object({
  status: z.enum(CarListingStatus),
});

export const imageMetadataSchema = z.object({
  altText: z.string().trim().max(180).optional(),
  isPrimary: z.coerce.boolean().optional(),
});

export const imageOrderSchema = z.object({
  imageIds: z.array(uuidSchema).min(1).max(20),
});

export const requestInputSchema = z
  .object({
    preferredMake: z.string().trim().max(120).optional().nullable(),
    preferredModel: z.string().trim().max(120).optional().nullable(),
    preferredVariant: z.string().trim().max(120).optional().nullable(),
    modelYearMin: yearSchema.optional().nullable(),
    modelYearMax: yearSchema.optional().nullable(),
    budgetMin: moneySchema.optional().nullable(),
    budgetMax: moneySchema.optional().nullable(),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('USD'),
    contactPreference: z.enum(['email', 'phone', 'whatsapp']).default('email'),
    notes: z.string().trim().max(3000).optional().nullable(),
  })
  .refine(
    (value) =>
      !value.modelYearMin || !value.modelYearMax || value.modelYearMin <= value.modelYearMax,
    { path: ['modelYearMax'], message: 'showroom.validation.range' },
  )
  .refine((value) => !value.budgetMin || !value.budgetMax || value.budgetMin <= value.budgetMax, {
    path: ['budgetMax'],
    message: 'showroom.validation.range',
  });

export const requestReviewSchema = z.object({
  status: z.enum([VehicleRequestStatus.APPROVED, VehicleRequestStatus.REJECTED]),
  decisionNote: z.string().trim().max(1000).optional().nullable(),
});

export const adminRequestQuerySchema = z.object({
  status: z.enum(VehicleRequestStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminVehicleQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(CarListingStatus).optional(),
  condition: z.enum(CarListingCondition).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminVehicleInputSchema = listingInputSchema.extend({
  status: z.enum(CarListingStatus).default(CarListingStatus.DRAFT),
});

export const adminVehicleUpdateSchema = listingUpdateSchema;

export const vehicleDefinitionQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  includeInactive: z.coerce.boolean().default(true),
  active: z.enum(['active', 'inactive', 'all']).default('all'),
  makeId: uuidSchema.optional(),
  modelId: uuidSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'sortOrder', 'isActive']).default('name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
  minSortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  maxSortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).refine((value) => !value.minSortOrder || !value.maxSortOrder || value.minSortOrder <= value.maxSortOrder, {
  path: ['maxSortOrder'],
  message: 'showroom.validation.range',
});

const definitionBaseSchema = z.object({
  name: textSchema.max(120),
  code: z.string().trim().min(1).max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  localizedNames: localizedNamesSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
});

export const makeDefinitionSchema = z.object({
  name: textSchema.max(120),
  country: z.string().trim().max(120).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export const modelDefinitionSchema = z.object({
  makeId: uuidSchema,
  name: textSchema.max(120),
  productionFrom: z.coerce.number().int().min(1886).max(new Date().getFullYear() + 5).optional().nullable(),
  productionTo: z.coerce.number().int().min(1886).max(new Date().getFullYear() + 5).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
}).refine((value) => !value.productionFrom || !value.productionTo || value.productionFrom <= value.productionTo, {
  path: ['productionTo'],
  message: 'showroom.validation.range',
});

export const trimDefinitionSchema = z.object({
  modelId: uuidSchema,
  name: textSchema.max(120),
  engineId: uuidSchema.optional().nullable(),
  transmissionId: uuidSchema.optional().nullable(),
  fuelTypeId: uuidSchema.optional().nullable(),
  bodyTypeId: uuidSchema.optional().nullable(),
  bodyType: z.enum(CarBodyType).optional(),
  fuelType: z.enum(CarFuelType).optional(),
  transmission: z.enum(CarTransmissionType).optional(),
  driveTrain: z.string().trim().max(120).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export const catalogDefinitionSchema = definitionBaseSchema;

export const colorDefinitionSchema = definitionBaseSchema.extend({
  hexCode: hexColorSchema,
});

export const usersRolesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.string().trim().max(80).optional(),
  state: z.enum(['active', 'disabled', 'all']).default('all'),
});

export function parseShowroomPayload<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    fieldErrors[key] = issue.message.startsWith('showroom.')
      ? issue.message
      : `showroom.validation.${issue.code}`;
  }

  throw new ShowroomHttpError(400, 'showroom.error.validation', fieldErrors);
}

export type ListingInput = z.infer<typeof listingInputSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type InventoryScope = z.infer<typeof inventoryScopeSchema>;
export type OptionQuery = z.infer<typeof optionQuerySchema>;
export type VehicleRequestInput = z.infer<typeof requestInputSchema>;
export type RequestReviewInput = z.infer<typeof requestReviewSchema>;
export type AdminVehicleQuery = z.infer<typeof adminVehicleQuerySchema>;
export type AdminVehicleInput = z.infer<typeof adminVehicleInputSchema>;
export type AdminVehicleUpdateInput = z.infer<typeof adminVehicleUpdateSchema>;
export type VehicleDefinitionEntity = z.infer<typeof vehicleDefinitionEntitySchema>;
export type VehicleDefinitionQuery = z.infer<typeof vehicleDefinitionQuerySchema>;
export type MakeDefinitionInput = z.infer<typeof makeDefinitionSchema>;
export type ModelDefinitionInput = z.infer<typeof modelDefinitionSchema>;
export type TrimDefinitionInput = z.infer<typeof trimDefinitionSchema>;
export type CatalogDefinitionInput = z.infer<typeof catalogDefinitionSchema>;
export type ColorDefinitionInput = z.infer<typeof colorDefinitionSchema>;
export type UsersRolesQuery = z.infer<typeof usersRolesQuerySchema>;
