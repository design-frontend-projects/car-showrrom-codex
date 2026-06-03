CREATE TABLE "showroom"."vehicle_engines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_engines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_transmissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_transmissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_fuel_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_fuel_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_body_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_body_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_conditions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "showroom"."car_variants"
    ADD COLUMN "engine_id" UUID,
    ADD COLUMN "transmission_id" UUID,
    ADD COLUMN "fuel_type_id" UUID,
    ADD COLUMN "body_type_id" UUID;

ALTER TABLE "showroom"."car_listings"
    ADD COLUMN "condition_id" UUID;

CREATE UNIQUE INDEX "vehicle_engines_tenant_id_id_key" ON "showroom"."vehicle_engines"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_engines_tenant_id_normalized_name_key" ON "showroom"."vehicle_engines"("tenant_id", "normalized_name");
CREATE UNIQUE INDEX "vehicle_engines_tenant_id_code_key" ON "showroom"."vehicle_engines"("tenant_id", "code");
CREATE INDEX "vehicle_engines_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_engines"("tenant_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "vehicle_transmissions_tenant_id_id_key" ON "showroom"."vehicle_transmissions"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_transmissions_tenant_id_normalized_name_key" ON "showroom"."vehicle_transmissions"("tenant_id", "normalized_name");
CREATE UNIQUE INDEX "vehicle_transmissions_tenant_id_code_key" ON "showroom"."vehicle_transmissions"("tenant_id", "code");
CREATE INDEX "vehicle_transmissions_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_transmissions"("tenant_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "vehicle_fuel_types_tenant_id_id_key" ON "showroom"."vehicle_fuel_types"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_fuel_types_tenant_id_normalized_name_key" ON "showroom"."vehicle_fuel_types"("tenant_id", "normalized_name");
CREATE UNIQUE INDEX "vehicle_fuel_types_tenant_id_code_key" ON "showroom"."vehicle_fuel_types"("tenant_id", "code");
CREATE INDEX "vehicle_fuel_types_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_fuel_types"("tenant_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "vehicle_body_types_tenant_id_id_key" ON "showroom"."vehicle_body_types"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_body_types_tenant_id_normalized_name_key" ON "showroom"."vehicle_body_types"("tenant_id", "normalized_name");
CREATE UNIQUE INDEX "vehicle_body_types_tenant_id_code_key" ON "showroom"."vehicle_body_types"("tenant_id", "code");
CREATE INDEX "vehicle_body_types_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_body_types"("tenant_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "vehicle_conditions_tenant_id_id_key" ON "showroom"."vehicle_conditions"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_conditions_tenant_id_normalized_name_key" ON "showroom"."vehicle_conditions"("tenant_id", "normalized_name");
CREATE UNIQUE INDEX "vehicle_conditions_tenant_id_code_key" ON "showroom"."vehicle_conditions"("tenant_id", "code");
CREATE INDEX "vehicle_conditions_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_conditions"("tenant_id", "is_active", "sort_order");

CREATE INDEX "car_variants_tenant_id_engine_id_idx" ON "showroom"."car_variants"("tenant_id", "engine_id");
CREATE INDEX "car_variants_tenant_id_transmission_id_idx" ON "showroom"."car_variants"("tenant_id", "transmission_id");
CREATE INDEX "car_variants_tenant_id_fuel_type_id_idx" ON "showroom"."car_variants"("tenant_id", "fuel_type_id");
CREATE INDEX "car_variants_tenant_id_body_type_id_idx" ON "showroom"."car_variants"("tenant_id", "body_type_id");
CREATE INDEX "car_listings_tenant_id_condition_id_idx" ON "showroom"."car_listings"("tenant_id", "condition_id");

ALTER TABLE "showroom"."vehicle_engines" ADD CONSTRAINT "vehicle_engines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_transmissions" ADD CONSTRAINT "vehicle_transmissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_fuel_types" ADD CONSTRAINT "vehicle_fuel_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_body_types" ADD CONSTRAINT "vehicle_body_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_conditions" ADD CONSTRAINT "vehicle_conditions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_engine_id_fkey" FOREIGN KEY ("tenant_id", "engine_id") REFERENCES "showroom"."vehicle_engines"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_transmission_id_fkey" FOREIGN KEY ("tenant_id", "transmission_id") REFERENCES "showroom"."vehicle_transmissions"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_fuel_type_id_fkey" FOREIGN KEY ("tenant_id", "fuel_type_id") REFERENCES "showroom"."vehicle_fuel_types"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_variants" ADD CONSTRAINT "car_variants_tenant_id_body_type_id_fkey" FOREIGN KEY ("tenant_id", "body_type_id") REFERENCES "showroom"."vehicle_body_types"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_condition_id_fkey" FOREIGN KEY ("tenant_id", "condition_id") REFERENCES "showroom"."vehicle_conditions"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "showroom"."vehicle_engines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_transmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_fuel_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_body_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_conditions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_vehicle_engines" ON "showroom"."vehicle_engines"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_transmissions" ON "showroom"."vehicle_transmissions"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_fuel_types" ON "showroom"."vehicle_fuel_types"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_body_types" ON "showroom"."vehicle_body_types"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_conditions" ON "showroom"."vehicle_conditions"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

INSERT INTO "showroom"."vehicle_engines" ("tenant_id", "name", "normalized_name", "code", "sort_order")
SELECT t."id", seed."name", seed."normalized_name", seed."code", seed."sort_order"
FROM "showroom"."tenants" t
CROSS JOIN (VALUES
  ('Unspecified engine', 'unspecified-engine', 'UNSPECIFIED', 0)
) AS seed("name", "normalized_name", "code", "sort_order")
ON CONFLICT ("tenant_id", "code") DO NOTHING;

INSERT INTO "showroom"."vehicle_transmissions" ("tenant_id", "name", "normalized_name", "code", "sort_order")
SELECT t."id", seed."name", seed."normalized_name", seed."code", seed."sort_order"
FROM "showroom"."tenants" t
CROSS JOIN (VALUES
  ('Automatic', 'automatic', 'AUTOMATIC', 10),
  ('Manual', 'manual', 'MANUAL', 20),
  ('CVT', 'cvt', 'CVT', 30),
  ('Dual clutch', 'dual-clutch', 'DUAL_CLUTCH', 40),
  ('Other', 'other', 'OTHER', 50)
) AS seed("name", "normalized_name", "code", "sort_order")
ON CONFLICT ("tenant_id", "code") DO NOTHING;

INSERT INTO "showroom"."vehicle_fuel_types" ("tenant_id", "name", "normalized_name", "code", "sort_order")
SELECT t."id", seed."name", seed."normalized_name", seed."code", seed."sort_order"
FROM "showroom"."tenants" t
CROSS JOIN (VALUES
  ('Petrol', 'petrol', 'PETROL', 10),
  ('Diesel', 'diesel', 'DIESEL', 20),
  ('Hybrid', 'hybrid', 'HYBRID', 30),
  ('Plug-in hybrid', 'plug-in-hybrid', 'PLUG_IN_HYBRID', 40),
  ('Electric', 'electric', 'ELECTRIC', 50),
  ('LPG', 'lpg', 'LPG', 60),
  ('Other', 'other', 'OTHER', 70)
) AS seed("name", "normalized_name", "code", "sort_order")
ON CONFLICT ("tenant_id", "code") DO NOTHING;

INSERT INTO "showroom"."vehicle_body_types" ("tenant_id", "name", "normalized_name", "code", "sort_order")
SELECT t."id", seed."name", seed."normalized_name", seed."code", seed."sort_order"
FROM "showroom"."tenants" t
CROSS JOIN (VALUES
  ('Sedan', 'sedan', 'SEDAN', 10),
  ('SUV', 'suv', 'SUV', 20),
  ('Coupe', 'coupe', 'COUPE', 30),
  ('Hatchback', 'hatchback', 'HATCHBACK', 40),
  ('Convertible', 'convertible', 'CONVERTIBLE', 50),
  ('Wagon', 'wagon', 'WAGON', 60),
  ('Pickup', 'pickup', 'PICKUP', 70),
  ('Van', 'van', 'VAN', 80),
  ('Crossover', 'crossover', 'CROSSOVER', 90),
  ('Other', 'other', 'OTHER', 100)
) AS seed("name", "normalized_name", "code", "sort_order")
ON CONFLICT ("tenant_id", "code") DO NOTHING;

INSERT INTO "showroom"."vehicle_conditions" ("tenant_id", "name", "normalized_name", "code", "sort_order")
SELECT t."id", seed."name", seed."normalized_name", seed."code", seed."sort_order"
FROM "showroom"."tenants" t
CROSS JOIN (VALUES
  ('New', 'new', 'NEW', 10),
  ('Certified pre-owned', 'certified-pre-owned', 'CERTIFIED_PRE_OWNED', 20),
  ('Used', 'used', 'USED', 30),
  ('Damaged', 'damaged', 'DAMAGED', 40)
) AS seed("name", "normalized_name", "code", "sort_order")
ON CONFLICT ("tenant_id", "code") DO NOTHING;

UPDATE "showroom"."car_variants" cv
SET "transmission_id" = vt."id"
FROM "showroom"."vehicle_transmissions" vt
WHERE vt."tenant_id" = cv."tenant_id"
  AND vt."code" = cv."transmission"::text;

UPDATE "showroom"."car_variants" cv
SET "fuel_type_id" = vf."id"
FROM "showroom"."vehicle_fuel_types" vf
WHERE vf."tenant_id" = cv."tenant_id"
  AND vf."code" = cv."fuel_type"::text;

UPDATE "showroom"."car_variants" cv
SET "body_type_id" = vb."id"
FROM "showroom"."vehicle_body_types" vb
WHERE vb."tenant_id" = cv."tenant_id"
  AND vb."code" = cv."body_type"::text;

UPDATE "showroom"."car_listings" cl
SET "condition_id" = vc."id"
FROM "showroom"."vehicle_conditions" vc
WHERE vc."tenant_id" = cl."tenant_id"
  AND vc."code" = cl."condition"::text;
