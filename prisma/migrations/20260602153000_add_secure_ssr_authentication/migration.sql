ALTER TABLE "showroom"."users"
    ADD COLUMN "email_verified_at" TIMESTAMP(3),
    ADD COLUMN "password_changed_at" TIMESTAMP(3),
    ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "two_factor_required" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "two_factor_secret_encrypted" TEXT,
    ADD COLUMN "two_factor_pending_secret_encrypted" TEXT,
    ADD COLUMN "two_factor_verified_at" TIMESTAMP(3),
    ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "locked_until" TIMESTAMP(3);

CREATE TABLE "showroom"."auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_token_hash" TEXT NOT NULL,
    "csrf_token_hash" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."password_reset_otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "reset_transaction_hash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "transaction_expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."user_backup_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_backup_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_sessions_session_token_hash_key" ON "showroom"."auth_sessions"("session_token_hash");
CREATE UNIQUE INDEX "password_reset_otps_reset_transaction_hash_key" ON "showroom"."password_reset_otps"("reset_transaction_hash");
CREATE UNIQUE INDEX "user_backup_codes_code_hash_key" ON "showroom"."user_backup_codes"("code_hash");

CREATE INDEX "users_tenant_id_is_active_idx" ON "showroom"."users"("tenant_id", "is_active");
CREATE INDEX "users_locked_until_idx" ON "showroom"."users"("locked_until");
CREATE INDEX "auth_sessions_user_id_idx" ON "showroom"."auth_sessions"("user_id");
CREATE INDEX "auth_sessions_expires_at_idx" ON "showroom"."auth_sessions"("expires_at");
CREATE INDEX "auth_sessions_revoked_at_idx" ON "showroom"."auth_sessions"("revoked_at");
CREATE INDEX "password_reset_otps_user_id_idx" ON "showroom"."password_reset_otps"("user_id");
CREATE INDEX "password_reset_otps_email_idx" ON "showroom"."password_reset_otps"("email");
CREATE INDEX "password_reset_otps_expires_at_idx" ON "showroom"."password_reset_otps"("expires_at");
CREATE INDEX "password_reset_otps_consumed_at_idx" ON "showroom"."password_reset_otps"("consumed_at");
CREATE INDEX "user_backup_codes_user_id_idx" ON "showroom"."user_backup_codes"("user_id");
CREATE INDEX "user_backup_codes_used_at_idx" ON "showroom"."user_backup_codes"("used_at");

ALTER TABLE "showroom"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "showroom"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."password_reset_otps"
    ADD CONSTRAINT "password_reset_otps_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "showroom"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."user_backup_codes"
    ADD CONSTRAINT "user_backup_codes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "showroom"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
