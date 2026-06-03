CREATE TABLE "showroom"."vehicle_exterior_colors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "hex_code" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_exterior_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "showroom"."vehicle_interior_colors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "hex_code" TEXT,
    "localized_names" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_interior_colors_pkey" PRIMARY KEY ("id")
);

INSERT INTO "showroom"."vehicle_exterior_colors" (
    "id",
    "tenant_id",
    "name",
    "normalized_name",
    "hex_code",
    "created_at",
    "updated_at"
)
SELECT DISTINCT c."id", c."tenant_id", c."name", c."normalized_name", c."hex_code", c."created_at", c."updated_at"
FROM "showroom"."car_colors" c
INNER JOIN "showroom"."car_listings" l
    ON l."tenant_id" = c."tenant_id"
   AND l."exterior_color_id" = c."id"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "showroom"."vehicle_interior_colors" (
    "id",
    "tenant_id",
    "name",
    "normalized_name",
    "hex_code",
    "created_at",
    "updated_at"
)
SELECT DISTINCT c."id", c."tenant_id", c."name", c."normalized_name", c."hex_code", c."created_at", c."updated_at"
FROM "showroom"."car_colors" c
INNER JOIN "showroom"."car_listings" l
    ON l."tenant_id" = c."tenant_id"
   AND l."interior_color_id" = c."id"
ON CONFLICT ("id") DO NOTHING;

UPDATE "showroom"."car_listings" l
SET "exterior_color_name" = COALESCE(l."exterior_color_name", c."name")
FROM "showroom"."car_colors" c
WHERE l."tenant_id" = c."tenant_id"
  AND l."exterior_color_id" = c."id";

UPDATE "showroom"."car_listings" l
SET "interior_color_name" = COALESCE(l."interior_color_name", c."name")
FROM "showroom"."car_colors" c
WHERE l."tenant_id" = c."tenant_id"
  AND l."interior_color_id" = c."id";

ALTER TABLE "showroom"."car_listings" DROP CONSTRAINT "car_listings_tenant_id_exterior_color_id_fkey";
ALTER TABLE "showroom"."car_listings" DROP CONSTRAINT "car_listings_tenant_id_interior_color_id_fkey";

CREATE UNIQUE INDEX "vehicle_exterior_colors_tenant_id_id_key" ON "showroom"."vehicle_exterior_colors"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_exterior_colors_tenant_id_normalized_name_key" ON "showroom"."vehicle_exterior_colors"("tenant_id", "normalized_name");
CREATE INDEX "vehicle_exterior_colors_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_exterior_colors"("tenant_id", "is_active", "sort_order");

CREATE UNIQUE INDEX "vehicle_interior_colors_tenant_id_id_key" ON "showroom"."vehicle_interior_colors"("tenant_id", "id");
CREATE UNIQUE INDEX "vehicle_interior_colors_tenant_id_normalized_name_key" ON "showroom"."vehicle_interior_colors"("tenant_id", "normalized_name");
CREATE INDEX "vehicle_interior_colors_tenant_id_is_active_sort_order_idx" ON "showroom"."vehicle_interior_colors"("tenant_id", "is_active", "sort_order");

CREATE INDEX "car_listings_tenant_id_exterior_color_id_idx" ON "showroom"."car_listings"("tenant_id", "exterior_color_id");
CREATE INDEX "car_listings_tenant_id_interior_color_id_idx" ON "showroom"."car_listings"("tenant_id", "interior_color_id");

ALTER TABLE "showroom"."vehicle_exterior_colors" ADD CONSTRAINT "vehicle_exterior_colors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."vehicle_interior_colors" ADD CONSTRAINT "vehicle_interior_colors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "showroom"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_exterior_color_id_fkey" FOREIGN KEY ("tenant_id", "exterior_color_id") REFERENCES "showroom"."vehicle_exterior_colors"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "showroom"."car_listings" ADD CONSTRAINT "car_listings_tenant_id_interior_color_id_fkey" FOREIGN KEY ("tenant_id", "interior_color_id") REFERENCES "showroom"."vehicle_interior_colors"("tenant_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "showroom"."vehicle_exterior_colors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showroom"."vehicle_interior_colors" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_vehicle_exterior_colors" ON "showroom"."vehicle_exterior_colors"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');

CREATE POLICY "tenant_isolation_vehicle_interior_colors" ON "showroom"."vehicle_interior_colors"
    USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true')
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid OR current_setting('app.rbac_bypass', true) = 'true');
