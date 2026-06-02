CREATE TYPE "showroom"."CarListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED', 'DELETED');
CREATE TYPE "showroom"."CarListingCondition" AS ENUM ('NEW', 'CERTIFIED_PRE_OWNED', 'USED', 'DAMAGED');
CREATE TYPE "showroom"."CarFuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER');
CREATE TYPE "showroom"."CarTransmissionType" AS ENUM ('AUTOMATIC', 'MANUAL', 'CVT', 'DUAL_CLUTCH', 'OTHER');
CREATE TYPE "showroom"."CarBodyType" AS ENUM ('SEDAN', 'SUV', 'COUPE', 'HATCHBACK', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'CROSSOVER', 'OTHER');
CREATE TYPE "showroom"."VehicleRequestStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "showroom"."ImageProvider" AS ENUM ('LOCAL');

CREATE TABLE "showroom"."car_makes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "country" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_makes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_models" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "make_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "production_from" INTEGER,
    "production_to" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "body_type" "showroom"."CarBodyType" NOT NULL,
    "fuel_type" "showroom"."CarFuelType" NOT NULL,
    "transmission" "showroom"."CarTransmissionType" NOT NULL,
    "drive_train" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_colors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "hex_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "seller_user_id" UUID NOT NULL,
    "make_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "exterior_color_id" UUID,
    "interior_color_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vin" TEXT,
    "model_year" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "mileage" INTEGER NOT NULL,
    "condition" "showroom"."CarListingCondition" NOT NULL,
    "exterior_color_name" TEXT,
    "interior_color_name" TEXT,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "showroom"."CarListingStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "sold_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_listing_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "provider" "showroom"."ImageProvider" NOT NULL DEFAULT 'LOCAL',
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_listing_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_price_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "old_price" DECIMAL(12,2) NOT NULL,
    "new_price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "changed_by_user_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_price_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."car_model_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "old_make_id" UUID,
    "new_make_id" UUID,
    "old_model_id" UUID,
    "new_model_id" UUID,
    "old_variant_id" UUID,
    "new_variant_id" UUID,
    "old_model_year" INTEGER,
    "new_model_year" INTEGER,
    "diff" JSONB NOT NULL,
    "changed_by_user_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_model_histories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "client_user_id" UUID NOT NULL,
    "preferred_make" TEXT,
    "preferred_model" TEXT,
    "preferred_variant" TEXT,
    "model_year_min" INTEGER,
    "model_year_max" INTEGER,
    "budget_min" DECIMAL(12,2),
    "budget_max" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "contact_preference" TEXT NOT NULL DEFAULT 'email',
    "notes" TEXT,
    "status" "showroom"."VehicleRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewer_user_id" UUID,
    "decision_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "car_makes_tenant_id_id_key" ON "showroom"."car_makes"("tenant_id", "id");
CREATE UNIQUE INDEX "car_makes_tenant_id_normalized_name_key" ON "showroom"."car_makes"("tenant_id", "normalized_name");
CREATE INDEX "car_makes_tenant_id_is_active_idx" ON "showroom"."car_makes"("tenant_id", "is_active");

CREATE UNIQUE INDEX "car_models_tenant_id_id_key" ON "showroom"."car_models"("tenant_id", "id");
CREATE UNIQUE INDEX "car_models_tenant_id_make_id_normalized_name_key" ON "showroom"."car_models"("tenant_id", "make_id", "normalized_name");
CREATE INDEX "car_models_tenant_id_make_id_idx" ON "showroom"."car_models"("tenant_id", "make_id");
CREATE INDEX "car_models_tenant_id_is_active_idx" ON "showroom"."car_models"("tenant_id", "is_active");

CREATE UNIQUE INDEX "car_variants_tenant_id_id_key" ON "showroom"."car_variants"("tenant_id", "id");
CREATE UNIQUE INDEX "car_variants_tenant_id_model_id_normalized_name_key" ON "showroom"."car_variants"("tenant_id", "model_id", "normalized_name");
CREATE INDEX "car_variants_tenant_id_model_id_idx" ON "showroom"."car_variants"("tenant_id", "model_id");
CREATE INDEX "car_variants_tenant_id_body_type_fuel_type_transmission_idx" ON "showroom"."car_variants"("tenant_id", "body_type", "fuel_type", "transmission");
CREATE INDEX "car_variants_tenant_id_is_active_idx" ON "showroom"."car_variants"("tenant_id", "is_active");

CREATE UNIQUE INDEX "car_colors_tenant_id_id_key" ON "showroom"."car_colors"("tenant_id", "id");
CREATE UNIQUE INDEX "car_colors_tenant_id_normalized_name_key" ON "showroom"."car_colors"("tenant_id", "normalized_name");
CREATE INDEX "car_colors_tenant_id_idx" ON "showroom"."car_colors"("tenant_id");

CREATE UNIQUE INDEX "car_listings_tenant_id_id_key" ON "showroom"."car_listings"("tenant_id", "id");
CREATE UNIQUE INDEX "car_listings_tenant_id_slug_key" ON "showroom"."car_listings"("tenant_id", "slug");
CREATE INDEX "car_listings_tenant_id_status_price_idx" ON "showroom"."car_listings"("tenant_id", "status", "price");
CREATE INDEX "car_listings_tenant_id_status_model_year_idx" ON "showroom"."car_listings"("tenant_id", "status", "model_year");
CREATE INDEX "car_listings_tenant_id_status_mileage_idx" ON "showroom"."car_listings"("tenant_id", "status", "mileage");
CREATE INDEX "car_listings_tenant_id_seller_user_id_status_idx" ON "showroom"."car_listings"("tenant_id", "seller_user_id", "status");
CREATE INDEX "car_listings_tenant_id_make_id_model_id_variant_id_idx" ON "showroom"."car_listings"("tenant_id", "make_id", "model_id", "variant_id");
CREATE INDEX "car_listings_tenant_id_location_idx" ON "showroom"."car_listings"("tenant_id", "location");
CREATE INDEX "car_listings_updated_at_idx" ON "showroom"."car_listings"("updated_at");

CREATE UNIQUE INDEX "car_listing_images_storage_key_key" ON "showroom"."car_listing_images"("storage_key");
CREATE UNIQUE INDEX "car_listing_images_tenant_id_listing_id_sort_order_key" ON "showroom"."car_listing_images"("tenant_id", "listing_id", "sort_order");
CREATE UNIQUE INDEX "car_listing_images_one_primary_per_listing_key" ON "showroom"."car_listing_images"("tenant_id", "listing_id") WHERE "is_primary" = true;
CREATE INDEX "car_listing_images_tenant_id_listing_id_idx" ON "showroom"."car_listing_images"("tenant_id", "listing_id");
CREATE INDEX "car_listing_images_tenant_id_listing_id_is_primary_idx" ON "showroom"."car_listing_images"("tenant_id", "listing_id", "is_primary");

CREATE INDEX "car_price_histories_tenant_id_listing_id_created_at_idx" ON "showroom"."car_price_histories"("tenant_id", "listing_id", "created_at");
CREATE INDEX "car_price_histories_tenant_id_changed_by_user_id_idx" ON "showroom"."car_price_histories"("tenant_id", "changed_by_user_id");

CREATE INDEX "car_model_histories_tenant_id_listing_id_created_at_idx" ON "showroom"."car_model_histories"("tenant_id", "listing_id", "created_at");
CREATE INDEX "car_model_histories_tenant_id_changed_by_user_id_idx" ON "showroom"."car_model_histories"("tenant_id", "changed_by_user_id");

CREATE UNIQUE INDEX "vehicle_requests_tenant_id_id_key" ON "showroom"."vehicle_requests"("tenant_id", "id");
CREATE INDEX "vehicle_requests_tenant_id_client_user_id_status_idx" ON "showroom"."vehicle_requests"("tenant_id", "client_user_id", "status");
CREATE INDEX "vehicle_requests_tenant_id_status_created_at_idx" ON "showroom"."vehicle_requests"("tenant_id", "status", "created_at");
CREATE INDEX "vehicle_requests_tenant_id_reviewer_user_id_idx" ON "showroom"."vehicle_requests"("tenant_id", "reviewer_user_id");

ALTER TABLE "showroom"."car_makes" ADD CONSTRAINT "car_makes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_models" ADD CONSTRAINT "car_models_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_models" ADD CONSTRAINT "car_models_tenant_id_make_id_fkey" FOREIGN KEY ("tenant_id", "make_id") REFERENCES "showroom"."car_makes"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_model_id_fkey" FOREIGN KEY ("tenant_id", "model_id") REFERENCES "showroom"."car_models"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_colors" ADD CONSTRAINT "car_colors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_seller_user_id_fkey" FOREIGN KEY ("tenant_id", "seller_user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_make_id_fkey" FOREIGN KEY ("tenant_id", "make_id") REFERENCES "showroom"."car_makes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_model_id_fkey" FOREIGN KEY ("tenant_id", "model_id") REFERENCES "showroom"."car_models"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_variant_id_fkey" FOREIGN KEY ("tenant_id", "variant_id") REFERENCES "showroom"."car_variants"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_exterior_color_id_fkey" FOREIGN KEY ("tenant_id", "exterior_color_id") REFERENCES "showroom"."car_colors"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_interior_color_id_fkey" FOREIGN KEY ("tenant_id", "interior_color_id") REFERENCES "showroom"."car_colors"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listing_images" ADD CONSTRAINT "car_listing_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listing_images" ADD CONSTRAINT "car_listing_images_tenant_id_listing_id_fkey" FOREIGN KEY ("tenant_id", "listing_id") REFERENCES "showroom"."car_listings"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_price_histories" ADD CONSTRAINT "car_price_histories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_price_histories" ADD CONSTRAINT "car_price_histories_tenant_id_listing_id_fkey" FOREIGN KEY ("tenant_id", "listing_id") REFERENCES "showroom"."car_listings"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_price_histories" ADD CONSTRAINT "car_price_histories_tenant_id_changed_by_user_id_fkey" FOREIGN KEY ("tenant_id", "changed_by_user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_model_histories" ADD CONSTRAINT "car_model_histories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_model_histories" ADD CONSTRAINT "car_model_histories_tenant_id_listing_id_fkey" FOREIGN KEY ("tenant_id", "listing_id") REFERENCES "showroom"."car_listings"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_model_histories" ADD CONSTRAINT "car_model_histories_tenant_id_changed_by_user_id_fkey" FOREIGN KEY ("tenant_id", "changed_by_user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_tenant_id_client_user_id_fkey" FOREIGN KEY ("tenant_id", "client_user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_requests" ADD CONSTRAINT "vehicle_requests_tenant_id_reviewer_user_id_fkey" FOREIGN KEY ("tenant_id", "reviewer_user_id") REFERENCES "showroom"."users"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "showroom"."car_makes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_colors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_listing_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_price_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."car_model_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_car_makes" ON "showroom"."car_makes"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_models" ON "showroom"."car_models"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_variants" ON "showroom"."car_variants"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_colors" ON "showroom"."car_colors"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_listings" ON "showroom"."car_listings"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_listing_images" ON "showroom"."car_listing_images"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_price_histories" ON "showroom"."car_price_histories"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_car_model_histories" ON "showroom"."car_model_histories"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_requests" ON "showroom"."vehicle_requests"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE OR REPLACE FUNCTION "showroom"."enforce_active_listing_limit"()
RETURNS trigger AS $$
DECLARE
    active_count INTEGER;
BEGIN
    IF NEW."status" = 'ACTIVE'::"showroom"."CarListingStatus"
       AND (
         TG_OP = 'INSERT'
         OR OLD."status" IS DISTINCT FROM NEW."status"
         OR OLD."seller_user_id" IS DISTINCT FROM NEW."seller_user_id"
         OR OLD."tenant_id" IS DISTINCT FROM NEW."tenant_id"
       ) THEN
        SELECT COUNT(*)
        INTO active_count
        FROM "showroom"."car_listings"
        WHERE "tenant_id" = NEW."tenant_id"
          AND "seller_user_id" = NEW."seller_user_id"
          AND "status" = 'ACTIVE'::"showroom"."CarListingStatus"
          AND "id" <> NEW."id";

        IF active_count >= 5 THEN
            RAISE EXCEPTION 'showroom.error.activeListingLimit'
                USING ERRCODE = 'P0001',
                      CONSTRAINT = 'car_listings_active_limit_per_client';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "car_listings_active_limit_trigger"
    BEFORE INSERT OR UPDATE OF "status", "seller_user_id", "tenant_id"
    ON "showroom"."car_listings"
    FOR EACH ROW
    EXECUTE FUNCTION "showroom"."enforce_active_listing_limit"();
