import { z } from 'zod';
import { authConfig } from '../auth/auth.config';
import { HttpError } from '../rbac/request-context';

const uuidSchema = z.string().uuid();
const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
const nullableTextSchema = z.string().trim().max(500).nullable().optional();
const secretFieldNames = new Set([
  'passwordHash',
  'tokenHash',
  'sessionTokenHash',
  'csrfTokenHash',
  'otpHash',
  'resetOtp',
  'totpSecret',
  'twoFactorSecretEncrypted',
  'backupCode',
  'backupCodeHash',
  'rawInvitationToken',
]);

export const passwordSchema = z
  .string()
  .min(authConfig.passwordMinLength)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const listUsersQuerySchema = z.object({
  state: z.enum(['active', 'disabled', 'all']).default('all'),
});

export const createUserSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(32).nullable().optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
    initialPassword: passwordSchema.optional(),
    generatePassword: z.boolean().optional(),
    roleIds: z.array(uuidSchema).max(25).default([]),
    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine(rejectSecretFields);

export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    displayName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
    isActive: z.boolean().optional(),
    roleIds: z.array(uuidSchema).max(25).optional(),
  })
  .strict()
  .superRefine(rejectSecretFields);

export const inviteUserSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().min(2).max(120).nullable().optional(),
    roleIds: z.array(uuidSchema).max(25).default([]),
    expiresInDays: z.number().int().min(1).max(30).default(7),
  })
  .strict()
  .superRefine(rejectSecretFields);

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(24),
    displayName: z.string().trim().min(2).max(120),
    password: passwordSchema,
    phone: z.string().trim().max(32).nullable().optional(),
  })
  .strict()
  .superRefine(rejectSecretFields);

export const roleSchema = z
  .object({
    name: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9-]*$/),
    description: nullableTextSchema,
  })
  .strict();

export const updateRoleSchema = roleSchema.partial().strict();

export const permissionSchema = z
  .object({
    action: z.string().trim().min(3).max(160).regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/),
    description: nullableTextSchema,
  })
  .strict();

export const updatePermissionSchema = permissionSchema.partial().strict();

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  actorUserId: uuidSchema.optional(),
  action: z.string().trim().max(160).optional(),
  targetType: z.string().trim().max(80).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RoleInput = z.infer<typeof roleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type PermissionInput = z.infer<typeof permissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  throwValidationError(result.error);
}

export function parseQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);

  if (result.success) {
    return result.data;
  }

  throwValidationError(result.error);
}

function throwValidationError(error: z.ZodError): never {
  const fieldErrors = Object.fromEntries(
    error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
  );

  throw new HttpError(400, JSON.stringify({ error: 'Validation failed.', fieldErrors }));
}

function rejectSecretFields(value: Record<string, unknown>, context: z.RefinementCtx): void {
  for (const key of Object.keys(value)) {
    if (secretFieldNames.has(key)) {
      context.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} must not be supplied by browser clients.`,
      });
    }
  }
}
