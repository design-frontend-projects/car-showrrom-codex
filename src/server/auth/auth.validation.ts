import { z } from 'zod';
import { authConfig } from './auth.config';
import { AuthHttpError } from './auth.errors';

const uuidSchema = z.string().uuid();
const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(authConfig.passwordMinLength, 'auth.validation.password.minLength')
  .regex(/[a-z]/, 'auth.validation.password.lowercase')
  .regex(/[A-Z]/, 'auth.validation.password.uppercase')
  .regex(/[0-9]/, 'auth.validation.password.number')
  .regex(/[^A-Za-z0-9]/, 'auth.validation.password.symbol');
const codeSchema = z.string().trim().regex(/^[0-9]{6,8}$/);

export const registerSchema = z.object({
  tenantId: uuidSchema.optional(),
  displayName: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(32).optional(),
  password: passwordSchema,
  remember: z.boolean().optional(),
});

export const loginSchema = z.object({
  tenantId: uuidSchema.optional(),
  email: emailSchema,
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const resetVerifySchema = z.object({
  email: emailSchema,
  otp: z.string().trim().regex(/^[0-9]{4,10}$/),
});

export const resetCompleteSchema = z.object({
  resetToken: z.string().min(24),
  password: passwordSchema,
});

export const twoFactorEnableSchema = z.object({
  challengeToken: z.string().optional(),
});

export const twoFactorVerifySchema = z.object({
  challengeToken: z.string().optional(),
  code: codeSchema.optional(),
  backupCode: z.string().trim().min(8).max(32).optional(),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1),
  code: codeSchema.optional(),
  backupCode: z.string().trim().min(8).max(32).optional(),
});

export const regenerateBackupCodesSchema = twoFactorDisableSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type ResetVerifyInput = z.infer<typeof resetVerifySchema>;
export type ResetCompleteInput = z.infer<typeof resetCompleteSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorDisableInput = z.infer<typeof twoFactorDisableSchema>;

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    fieldErrors[key] = issue.message.startsWith('auth.') ? issue.message : `auth.validation.${issue.code}`;
  }

  throw new AuthHttpError(400, 'auth.error.validation', fieldErrors);
}
