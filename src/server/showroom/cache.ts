import type { ShowroomTx } from './repositories';
import { countActiveInventoryByCondition } from './repositories';

export interface VehicleInventoryCounters {
  newCars: number;
  usedCars: number;
  cachedAt: string;
}

const COUNTER_TTL_MS = 15_000;
const counterCache = new Map<string, { expiresAt: number; value: VehicleInventoryCounters }>();

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

export function clearVehicleInventoryCounterCache(): void {
  counterCache.clear();
}
