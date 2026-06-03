import { clearVehicleInventoryCounterCache } from './cache';
import { ShowroomContext } from './auth';
import { ShowroomHttpError } from './errors';
import type { ShowroomTx } from './repositories';
import {
  createVehicleDefinition,
  deactivateVehicleDefinition,
  listVehicleOptions,
  listUsersAndRoles,
  listVehicleDefinitions,
} from './services';

describe('admin vehicle definition services', () => {
  const adminContext: ShowroomContext = {
    tenantId: 'tenant-id',
    userId: 'admin-id',
    bypassTenantIsolation: false,
    permissions: new Set(),
    roles: new Set(['admin']),
  };
  const userContext: ShowroomContext = {
    tenantId: 'tenant-id',
    userId: 'user-id',
    bypassTenantIsolation: false,
    permissions: new Set(),
    roles: new Set(['user']),
  };

  beforeEach(() => {
    clearVehicleInventoryCounterCache();
  });

  it('rejects non-admin definition mutations before writes', async () => {
    const tx = {
      carMake: {
        create: vi.fn(),
      },
      rbacAuditEvent: {
        create: vi.fn(),
      },
    };

    await expect(createVehicleDefinition(tx as never, userContext, 'makes', { name: 'BMW' })).rejects.toMatchObject({
      status: 403,
      code: 'showroom.error.accessDenied',
    });

    expect(tx.carMake.create).not.toHaveBeenCalled();
    expect(tx.rbacAuditEvent.create).not.toHaveBeenCalled();
  });

  it('returns sanitized users with role membership for authorized admins', async () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    const tx = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'user-id',
            tenantId: 'tenant-id',
            email: 'ada@example.com',
            displayName: 'Ada',
            phone: null,
            avatarUrl: null,
            isActive: true,
            lastLoginAt: now,
            createdAt: now,
            updatedAt: now,
            passwordHash: 'must-not-leak',
            resetOtpHash: 'must-not-leak',
            roles: [
              {
                role: {
                  id: 'role-id',
                  name: 'admin',
                  description: 'Administrator',
                  isSystem: true,
                },
              },
            ],
          },
        ]),
      },
    };

    const users = await listUsersAndRoles(tx as never, adminContext, { q: 'ada', role: 'admin', state: 'active' });

    expect(tx.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-id',
          isActive: true,
        }),
      }),
    );
    expect(JSON.stringify(users)).toContain('ada@example.com');
    expect(JSON.stringify(users)).toContain('admin');
    expect(JSON.stringify(users)).not.toContain('must-not-leak');
    expect(JSON.stringify(users)).not.toContain('passwordHash');
  });

  it('audits create operations and invalidates cached definition lists', async () => {
    const first = makeRecord('old-id', 'Old make');
    const second = makeRecord('new-id', 'New make');
    const created = makeRecord('created-id', 'Created make');
    const tx = {
      carMake: {
        findMany: vi.fn().mockResolvedValueOnce([first]).mockResolvedValueOnce([second]),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue(created),
      },
      rbacAuditEvent: {
        create: vi.fn(),
      },
    };

    await expect(definitionItems(tx as never, adminContext, 'makes')).resolves.toEqual([
      expect.objectContaining({ id: 'old-id' }),
    ]);
    await expect(definitionItems(tx as never, adminContext, 'makes')).resolves.toEqual([
      expect.objectContaining({ id: 'old-id' }),
    ]);

    await expect(createVehicleDefinition(tx as never, adminContext, 'makes', { name: 'Created make' })).resolves.toEqual(
      expect.objectContaining({ id: 'created-id' }),
    );
    await expect(definitionItems(tx as never, adminContext, 'makes')).resolves.toEqual([
      expect.objectContaining({ id: 'new-id' }),
    ]);

    expect(tx.carMake.findMany).toHaveBeenCalledTimes(2);
    expect(tx.carMake.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-id',
        name: 'Created make',
        normalizedName: 'created-make',
        isActive: true,
      }),
    });
    expect(tx.rbacAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-id',
        actorUserId: 'admin-id',
        action: 'vehicle-definition.makes.created',
        targetType: 'makes',
        targetId: 'created-id',
      }),
    });
  });

  it('manages exterior color definitions with swatches and localized names', async () => {
    const first = colorRecord('old-color-id', 'Old white');
    const second = colorRecord('new-color-id', 'New white');
    const created = colorRecord('created-color-id', 'Pearl white');
    const tx = {
      vehicleExteriorColor: {
        findMany: vi.fn().mockResolvedValueOnce([first]).mockResolvedValueOnce([second]),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue(created),
      },
      rbacAuditEvent: {
        create: vi.fn(),
      },
    };

    await expect(definitionItems(tx as never, adminContext, 'exterior-colors')).resolves.toEqual([
      expect.objectContaining({ id: 'old-color-id', hexCode: '#ffffff' }),
    ]);
    await expect(
      createVehicleDefinition(tx as never, adminContext, 'exterior-colors', {
        name: 'Pearl white',
        hexCode: '#ffffff',
        localizedNames: { ar: 'أبيض لؤلؤي' },
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'created-color-id' }));
    await expect(definitionItems(tx as never, adminContext, 'exterior-colors')).resolves.toEqual([
      expect.objectContaining({ id: 'new-color-id' }),
    ]);

    expect(tx.vehicleExteriorColor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-id',
        name: 'Pearl white',
        normalizedName: 'pearl-white',
        hexCode: '#ffffff',
        localizedNames: { ar: 'أبيض لؤلؤي' },
      }),
    });
    expect(tx.rbacAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'vehicle-definition.exterior-colors.created',
        targetType: 'exterior-colors',
        targetId: 'created-color-id',
      }),
    });
  });

  it('rejects orphaned model definitions and deactivates valid definitions instead of hard deleting', async () => {
    const tx = {
      carMake: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      carModel: {
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
      },
      rbacAuditEvent: {
        create: vi.fn(),
      },
    };

    await expect(
      createVehicleDefinition(tx as never, adminContext, 'models', { makeId: 'other-tenant-make', name: 'Camry' }),
    ).rejects.toBeInstanceOf(ShowroomHttpError);

    expect(tx.carModel.create).not.toHaveBeenCalled();

    await deactivateVehicleDefinition(tx as never, adminContext, 'models', 'model-id');

    expect(tx.carModel.update).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: 'tenant-id', id: 'model-id' } },
      data: { isActive: false },
    });
    expect(tx.rbacAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'vehicle-definition.models.deactivated',
        targetId: 'model-id',
      }),
    });
  });

  it('loads focused option results with dependency filters and selected inactive inclusion', async () => {
    const model = {
      id: 'model-id',
      tenantId: 'tenant-id',
      makeId: 'make-id',
      name: 'Cayenne',
      normalizedName: 'cayenne',
      productionFrom: null,
      productionTo: null,
      isActive: false,
      createdAt: new Date('2026-06-03T12:00:00.000Z'),
      updatedAt: new Date('2026-06-03T12:00:00.000Z'),
    };
    const tx = {
      carModel: {
        findMany: vi.fn().mockResolvedValue([model]),
        count: vi.fn().mockResolvedValue(1),
      },
    };

    const result = await listVehicleOptions(tx as never, 'tenant-id', 'models', {
      includeInactive: false,
      selectedId: 'model-id',
      makeId: 'make-id',
      limit: 50,
    });

    expect(result.items).toEqual([expect.objectContaining({ id: 'model-id', makeId: 'make-id' })]);
    expect(tx.carModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-id',
          makeId: 'make-id',
        }),
      }),
    );
  });
});

async function definitionItems(
  tx: ShowroomTx,
  context: ShowroomContext,
  entity: Parameters<typeof listVehicleDefinitions>[2],
) {
  const result = await listVehicleDefinitions(tx, context, entity, {
    includeInactive: false,
    active: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 20,
  });

  return result.items;
}

function makeRecord(id: string, name: string) {
  return {
    id,
    tenantId: 'tenant-id',
    name,
    normalizedName: name.toLowerCase().replace(/\s+/g, '-'),
    country: null,
    isActive: true,
    createdAt: new Date('2026-06-03T12:00:00.000Z'),
    updatedAt: new Date('2026-06-03T12:00:00.000Z'),
  };
}

function colorRecord(id: string, name: string) {
  return {
    id,
    tenantId: 'tenant-id',
    name,
    normalizedName: name.toLowerCase().replace(/\s+/g, '-'),
    hexCode: '#ffffff',
    localizedNames: {},
    isActive: true,
    sortOrder: 10,
    createdAt: new Date('2026-06-03T12:00:00.000Z'),
    updatedAt: new Date('2026-06-03T12:00:00.000Z'),
  };
}
