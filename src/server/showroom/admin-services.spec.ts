import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import { createAdminVehicle, updateAdminVehicle } from './services';
import type { ShowroomContext } from './auth';
import type { ShowroomTx } from './repositories';

describe('admin showroom vehicle services', () => {
  const context: ShowroomContext = {
    tenantId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    bypassTenantIsolation: false,
    permissions: new Set([SHOWROOM_PERMISSIONS.adminManage]),
    roles: new Set(['admin']),
  };

  it('creates published admin vehicles without checking the client active-listing limit', async () => {
    const tx = {
      carVariant: { findFirst: vi.fn().mockResolvedValue({ id: 'variant-id' }) },
      carListing: {
        count: vi.fn(),
        create: vi.fn().mockResolvedValue(listingRecord({ status: 'ACTIVE' })),
      },
    } as unknown as ShowroomTx;

    await createAdminVehicle(tx, context, {
      makeId: '00000000-0000-0000-0000-000000000011',
      modelId: '00000000-0000-0000-0000-000000000012',
      variantId: '00000000-0000-0000-0000-000000000013',
      title: 'Admin vehicle',
      modelYear: 2026,
      price: 72000,
      currency: 'USD',
      mileage: 10,
      condition: 'NEW',
      location: 'Main showroom',
      description: 'Admin vehicle description long enough for validation.',
      status: 'ACTIVE',
    });

    expect(tx.carListing.count).not.toHaveBeenCalled();
    expect(tx.carListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerUserId: context.userId,
          status: 'ACTIVE',
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('records price and model history when administrators update listing economics and taxonomy', async () => {
    const existing = listingRecord({
      makeId: '00000000-0000-0000-0000-000000000011',
      modelId: '00000000-0000-0000-0000-000000000012',
      variantId: '00000000-0000-0000-0000-000000000013',
      modelYear: 2025,
      price: 70000,
    });
    const tx = {
      carListing: {
        findFirst: vi.fn().mockResolvedValue(existing),
        update: vi.fn().mockResolvedValue(
          listingRecord({
            makeId: '00000000-0000-0000-0000-000000000021',
            modelId: '00000000-0000-0000-0000-000000000022',
            variantId: '00000000-0000-0000-0000-000000000023',
            modelYear: 2026,
            price: 68000,
          }),
        ),
      },
      carVariant: { findFirst: vi.fn().mockResolvedValue({ id: 'variant-id' }) },
      carPriceHistory: { create: vi.fn().mockResolvedValue({}) },
      carModelHistory: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as ShowroomTx;

    await updateAdminVehicle(tx, context, existing.id, {
      makeId: '00000000-0000-0000-0000-000000000021',
      modelId: '00000000-0000-0000-0000-000000000022',
      variantId: '00000000-0000-0000-0000-000000000023',
      modelYear: 2026,
      price: 68000,
      priceChangeReason: 'Campaign pricing',
      modelChangeReason: 'Correct trim',
    });

    expect(tx.carPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          oldPrice: existing.price,
          newPrice: 68000,
          changedByUserId: context.userId,
          reason: 'Campaign pricing',
        }),
      }),
    );
    expect(tx.carModelHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          oldMakeId: existing.makeId,
          newMakeId: '00000000-0000-0000-0000-000000000021',
          oldModelYear: 2025,
          newModelYear: 2026,
          reason: 'Correct trim',
        }),
      }),
    );
  });

  it('rejects admin vehicle creation with an invalid exterior color reference', async () => {
    const tx = {
      carVariant: { findFirst: vi.fn().mockResolvedValue({ id: 'variant-id' }) },
      vehicleExteriorColor: { findUnique: vi.fn().mockResolvedValue(null) },
      carListing: {
        create: vi.fn(),
      },
    } as unknown as ShowroomTx;

    await expect(
      createAdminVehicle(tx, context, {
        makeId: '00000000-0000-0000-0000-000000000011',
        modelId: '00000000-0000-0000-0000-000000000012',
        variantId: '00000000-0000-0000-0000-000000000013',
        exteriorColorId: '00000000-0000-0000-0000-000000000099',
        title: 'Admin vehicle',
        modelYear: 2026,
        price: 72000,
        currency: 'USD',
        mileage: 10,
        condition: 'NEW',
        location: 'Main showroom',
        description: 'Admin vehicle description long enough for validation.',
        status: 'ACTIVE',
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'showroom.error.invalidTaxonomy',
    });
    expect(tx.carListing.create).not.toHaveBeenCalled();
  });
});

function listingRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: '00000000-0000-0000-0000-000000000099',
    tenantId: '00000000-0000-0000-0000-000000000001',
    sellerUserId: '00000000-0000-0000-0000-000000000002',
    makeId: '00000000-0000-0000-0000-000000000011',
    modelId: '00000000-0000-0000-0000-000000000012',
    variantId: '00000000-0000-0000-0000-000000000013',
    exteriorColorId: null,
    interiorColorId: null,
    title: 'Admin vehicle',
    slug: 'admin-vehicle',
    vin: null,
    modelYear: 2026,
    price: 72000,
    currency: 'USD',
    mileage: 10,
    condition: 'NEW',
    exteriorColorName: null,
    interiorColorName: null,
    location: 'Main showroom',
    description: 'Admin vehicle description.',
    status: 'ACTIVE',
    publishedAt: now,
    soldAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    make: { id: 'make-id', tenantId: 'tenant-id', name: 'Make', normalizedName: 'make', country: null, isActive: true, createdAt: now, updatedAt: now },
    model: { id: 'model-id', tenantId: 'tenant-id', makeId: 'make-id', name: 'Model', normalizedName: 'model', productionFrom: null, productionTo: null, isActive: true, createdAt: now, updatedAt: now },
    variant: { id: 'variant-id', tenantId: 'tenant-id', modelId: 'model-id', name: 'Trim', normalizedName: 'trim', bodyType: 'SUV', fuelType: 'PETROL', transmission: 'AUTOMATIC', driveTrain: null, isActive: true, createdAt: now, updatedAt: now },
    seller: { id: 'seller-id', displayName: 'Admin' },
    images: [],
    priceHistory: [],
    modelHistory: [],
    ...overrides,
  };
}
