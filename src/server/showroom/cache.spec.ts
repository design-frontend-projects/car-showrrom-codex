import { CarListingCondition } from '../../generated/prisma/client';
import {
  clearVehicleInventoryCounterCache,
  getCachedVehicleInventoryCounters,
  invalidateVehicleInventoryCounters,
} from './cache';
import type { ShowroomTx } from './repositories';

describe('vehicle inventory counter cache', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  afterEach(() => {
    clearVehicleInventoryCounterCache();
  });

  it('groups active new and used counters and serves fresh repeated reads from cache', async () => {
    const groupBy = vi.fn().mockResolvedValue([
      { condition: CarListingCondition.NEW, _count: { _all: 3 } },
      { condition: CarListingCondition.USED, _count: { _all: 4 } },
      { condition: CarListingCondition.CERTIFIED_PRE_OWNED, _count: { _all: 2 } },
    ]);
    const tx = { carListing: { groupBy } } as unknown as ShowroomTx;

    const first = await getCachedVehicleInventoryCounters(tx, tenantId);
    const second = await getCachedVehicleInventoryCounters(tx, tenantId);

    expect(first.newCars).toBe(3);
    expect(first.usedCars).toBe(6);
    expect(second).toEqual(first);
    expect(groupBy).toHaveBeenCalledTimes(1);
  });

  it('invalidates tenant counters after relevant mutations', async () => {
    const groupBy = vi
      .fn()
      .mockResolvedValueOnce([{ condition: CarListingCondition.NEW, _count: { _all: 1 } }])
      .mockResolvedValueOnce([{ condition: CarListingCondition.NEW, _count: { _all: 2 } }]);
    const tx = { carListing: { groupBy } } as unknown as ShowroomTx;

    await getCachedVehicleInventoryCounters(tx, tenantId);
    invalidateVehicleInventoryCounters(tenantId);
    const refreshed = await getCachedVehicleInventoryCounters(tx, tenantId);

    expect(refreshed.newCars).toBe(2);
    expect(groupBy).toHaveBeenCalledTimes(2);
  });
});
