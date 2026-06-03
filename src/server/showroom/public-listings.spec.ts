import { searchListings } from './services';
import type { ShowroomTx } from './repositories';

describe('public showroom listing queries', () => {
  it('scopes used inventory to used, certified, and damaged active listings', async () => {
    const tx = {
      carListing: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    } as unknown as ShowroomTx;

    const result = await searchListings(tx, 'tenant-id', {
      inventoryScope: 'used',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });

    expect(result).toMatchObject({ total: 0, page: 1, pageSize: 12 });
    expect(tx.carListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-id',
          status: 'ACTIVE',
          condition: { in: ['CERTIFIED_PRE_OWNED', 'USED', 'DAMAGED'] },
        }),
      }),
    );
  });

  it('scopes new inventory to active new listings only', async () => {
    const tx = {
      carListing: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    } as unknown as ShowroomTx;

    await searchListings(tx, 'tenant-id', {
      inventoryScope: 'new',
      sort: 'newest',
      page: 1,
      pageSize: 12,
    });

    expect(tx.carListing.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          condition: { in: ['NEW'] },
        }),
      }),
    );
  });
});
