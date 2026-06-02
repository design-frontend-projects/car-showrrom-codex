CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "showroom"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "showroom"."tenants"("slug");
CREATE UNIQUE INDEX "users_tenant_id_id_key" ON "showroom"."users"("tenant_id", "id");
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "showroom"."users"("tenant_id", "email");
CREATE UNIQUE INDEX "roles_tenant_id_id_key" ON "showroom"."roles"("tenant_id", "id");
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "showroom"."roles"("tenant_id", "name");
CREATE UNIQUE INDEX "permissions_tenant_id_id_key" ON "showroom"."permissions"("tenant_id", "id");
CREATE UNIQUE INDEX "permissions_tenant_id_action_key" ON "showroom"."permissions"("tenant_id", "action");
CREATE UNIQUE INDEX "user_roles_tenant_id_user_id_role_id_key" ON "showroom"."user_roles"("tenant_id", "user_id", "role_id");
CREATE UNIQUE INDEX "role_permissions_tenant_id_role_id_permission_id_key" ON "showroom"."role_permissions"("tenant_id", "role_id", "permission_id");

CREATE INDEX "users_tenant_id_idx" ON "showroom"."users"("tenant_id");
CREATE INDEX "users_tenant_id_email_idx" ON "showroom"."users"("tenant_id", "email");
CREATE INDEX "roles_tenant_id_idx" ON "showroom"."roles"("tenant_id");
CREATE INDEX "permissions_tenant_id_idx" ON "showroom"."permissions"("tenant_id");
CREATE INDEX "user_roles_tenant_id_idx" ON "showroom"."user_roles"("tenant_id");
CREATE INDEX "user_roles_tenant_id_user_id_idx" ON "showroom"."user_roles"("tenant_id", "user_id");
CREATE INDEX "user_roles_tenant_id_role_id_idx" ON "showroom"."user_roles"("tenant_id", "role_id");
CREATE INDEX "user_roles_user_id_idx" ON "showroom"."user_roles"("user_id");
CREATE INDEX "user_roles_role_id_idx" ON "showroom"."user_roles"("role_id");
CREATE INDEX "role_permissions_tenant_id_idx" ON "showroom"."role_permissions"("tenant_id");
CREATE INDEX "role_permissions_tenant_id_role_id_idx" ON "showroom"."role_permissions"("tenant_id", "role_id");
CREATE INDEX "role_permissions_tenant_id_permission_id_idx" ON "showroom"."role_permissions"("tenant_id", "permission_id");
CREATE INDEX "role_permissions_role_id_idx" ON "showroom"."role_permissions"("role_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "showroom"."role_permissions"("permission_id");

ALTER TABLE "showroom"."users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."permissions" ADD CONSTRAINT "permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."user_roles" ADD CONSTRAINT "user_roles_tenant_id_user_id_fkey" FOREIGN KEY ("tenant_id", "user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."user_roles" ADD CONSTRAINT "user_roles_tenant_id_role_id_fkey" FOREIGN KEY ("tenant_id", "role_id") REFERENCES "showroom"."roles"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_role_id_fkey" FOREIGN KEY ("tenant_id", "role_id") REFERENCES "showroom"."roles"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_permission_id_fkey" FOREIGN KEY ("tenant_id", "permission_id") REFERENCES "showroom"."permissions"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."role_permissions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_users" ON "showroom"."users"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_roles" ON "showroom"."roles"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_permissions" ON "showroom"."permissions"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_user_roles" ON "showroom"."user_roles"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_role_permissions" ON "showroom"."role_permissions"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');
