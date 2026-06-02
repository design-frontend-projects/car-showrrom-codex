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
const moneySchema = z.coerce.number().finite().min(0).max(99_999_999);
const yearSchema = z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2);
const mileageSchema = z.coerce.number().int().min(0).max(5_000_000);

export const searchQuerySchema = z
  .object({
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
export type VehicleRequestInput = z.infer<typeof requestInputSchema>;
export type RequestReviewInput = z.infer<typeof requestReviewSchema>;
