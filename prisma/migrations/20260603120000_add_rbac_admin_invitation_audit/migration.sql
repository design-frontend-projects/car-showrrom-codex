-- Adds tenant-scoped RBAC admin invitation and audit persistence.
-- Rollback: drop policies, then drop rbac_audit_events and user_invitations before reverting the Prisma schema.

CREATE TABLE "showroom"."user_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "display_name" TEXT,
    "token_hash" TEXT NOT NULL,
    "target_roles" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "resent_at" TIMESTAMP(3),
    "inviter_user_id" UUID NOT NULL,
    "resulting_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."rbac_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_invitations_token_hash_key" ON "showroom"."user_invitations"("token_hash");
CREATE UNIQUE INDEX "user_invitations_tenant_id_id_key" ON "showroom"."user_invitations"("tenant_id", "id");
CREATE INDEX "user_invitations_tenant_id_status_expires_at_idx" ON "showroom"."user_invitations"("tenant_id", "status", "expires_at");
CREATE INDEX "user_invitations_tenant_id_normalized_email_idx" ON "showroom"."user_invitations"("tenant_id", "normalized_email");
CREATE INDEX "user_invitations_tenant_id_inviter_user_id_idx" ON "showroom"."user_invitations"("tenant_id", "inviter_user_id");
CREATE INDEX "user_invitations_tenant_id_resulting_user_id_idx" ON "showroom"."user_invitations"("tenant_id", "resulting_user_id");

CREATE UNIQUE INDEX "rbac_audit_events_tenant_id_id_key" ON "showroom"."rbac_audit_events"("tenant_id", "id");
CREATE INDEX "rbac_audit_events_tenant_id_created_at_idx" ON "showroom"."rbac_audit_events"("tenant_id", "created_at");
CREATE INDEX "rbac_audit_events_tenant_id_actor_user_id_idx" ON "showroom"."rbac_audit_events"("tenant_id", "actor_user_id");
CREATE INDEX "rbac_audit_events_tenant_id_action_idx" ON "showroom"."rbac_audit_events"("tenant_id", "action");
CREATE INDEX "rbac_audit_events_tenant_id_target_type_target_id_idx" ON "showroom"."rbac_audit_events"("tenant_id", "target_type", "target_id");

ALTER TABLE "showroom"."user_invitations"
    ADD CONSTRAINT "user_invitations_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."user_invitations"
    ADD CONSTRAINT "user_invitations_tenant_id_inviter_user_id_fkey"
    FOREIGN KEY ("tenant_id", "inviter_user_id") REFERENCES "showroom"."users"("tenant_id", "id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."user_invitations"
    ADD CONSTRAINT "user_invitations_tenant_id_resulting_user_id_fkey"
    FOREIGN KEY ("tenant_id", "resulting_user_id") REFERENCES "showroom"."users"("tenant_id", "id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "showroom"."rbac_audit_events"
    ADD CONSTRAINT "rbac_audit_events_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."rbac_audit_events"
    ADD CONSTRAINT "rbac_audit_events_tenant_id_actor_user_id_fkey"
    FOREIGN KEY ("tenant_id", "actor_user_id") REFERENCES "showroom"."users"("tenant_id", "id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "showroom"."user_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."rbac_audit_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_user_invitations" ON "showroom"."user_invitations"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_rbac_audit_events" ON "showroom"."rbac_audit_events"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');
