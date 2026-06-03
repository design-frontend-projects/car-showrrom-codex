import type { ShowroomTx } from './repositories';
import { countActiveInventoryByCondition } from './repositories';

export interface VehicleInventoryCounters {
  newCars: number;
  usedCars: number;
  cachedAt: string;
}

const COUNTER_TTL_MS = 15_000;
const CATALOG_TTL_MS = 60_000;
const counterCache = new Map<string, { expiresAt: number; value: VehicleInventoryCounters }>();
const catalogCache = new Map<string, { expiresAt: number; value: unknown }>();

export async function getCachedVehicleInventoryCounters(
  tx: ShowroomTx,
  tenantId: string,
): Promise<VehicleInventoryCounters> {
  const cached = counterCache.get(tenantId);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const counts = await countActiveInventoryByCondition(tx, tenantId);
  const value = {
    ...counts,
    cachedAt: new Date().toISOString(),
  };

  counterCache.set(tenantId, {
    value,
    expiresAt: now + COUNTER_TTL_MS,
  });

  return value;
}

export function invalidateVehicleInventoryCounters(tenantId: string): void {
  counterCache.delete(tenantId);
}

export async function getCachedVehicleCatalogList<T>(
  tenantId: string,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${tenantId}:${key}`;
  const cached = catalogCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = await loader();
  catalogCache.set(cacheKey, {
    value,
    expiresAt: now + CATALOG_TTL_MS,
  });

  return value;
}

export function invalidateVehicleCatalogCache(tenantId: string, entity?: string): void {
  const prefix = `${tenantId}:`;

  for (const key of catalogCache.keys()) {
    if (key.startsWith(prefix) && (!entity || key.includes(`:${entity}:`) || key.endsWith(`:${entity}`))) {
      catalogCache.delete(key);
    }
  }
}

export function clearVehicleInventoryCounterCache(): void {
  counterCache.clear();
  catalogCache.clear();
}
