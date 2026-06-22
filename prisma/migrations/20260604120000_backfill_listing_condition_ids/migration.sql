UPDATE "showroom"."car_listings" cl
SET "condition_id" = vc."id"
FROM "showroom"."vehicle_conditions" vc
WHERE cl."condition_id" IS NULL
  AND vc."tenant_id" = cl."tenant_id"
  AND vc."code" = cl."condition"::text
  AND vc."is_active" = true;
