import {
  buildAdminVehiclePayload,
  buildPreview,
  createImageQueueItem,
  reorderQueue,
  validateAdminImageFile,
  vehicleColorLabel,
} from './admin-vehicle-form.util';
import type { AdminVehicleFormValue } from './admin-vehicle-form.util';

describe('admin vehicle form utilities', () => {
  const formValue: AdminVehicleFormValue = {
    makeId: 'make-id',
    modelId: 'model-id',
    variantId: 'variant-id',
    title: '  2026 Test SUV  ',
    modelYear: 2026,
    originalPrice: 80000,
    salePrice: 74000,
    discount: 6000,
    mileage: 120,
    condition: 'NEW',
    status: 'ACTIVE',
    location: 'Main showroom',
    engine: '2.0L hybrid',
    transmission: 'AUTOMATIC',
    fuelType: 'HYBRID',
    bodyType: 'SUV',
    exteriorColorId: 'exterior-color-id',
    interiorColorId: 'interior-color-id',
    exteriorColorName: 'Pearl white',
    interiorColorName: 'Black',
    features: ['360 camera', 'Premium audio'],
    description: 'A pristine test vehicle with full service history.',
  };

  it('builds a server payload with composed admin description details', () => {
    const payload = buildAdminVehiclePayload(formValue);

    expect(payload.title).toBe('2026 Test SUV');
    expect(payload.price).toBe(74000);
    expect(payload.status).toBe('ACTIVE');
    expect(payload.exteriorColorId).toBe('exterior-color-id');
    expect(payload.interiorColorId).toBe('interior-color-id');
    expect(payload.description).toContain('Engine: 2.0L hybrid');
    expect(payload.description).toContain('Features: 360 camera, Premium audio');
  });

  it('projects live preview values from form state and labels', () => {
    const preview = buildPreview(
      formValue,
      { make: 'Test', model: 'SUV', variant: 'Premium' },
      '/media/listings/test.webp',
    );

    expect(preview.title).toBe('2026 Test SUV');
    expect(preview.subtitle).toBe('Test SUV Premium 2026');
    expect(preview.imageUrl).toBe('/media/listings/test.webp');
    expect(preview.discount).toBe(6000);
    expect(preview.exteriorColorName).toBe('Pearl white');
  });

  it('uses localized color labels with canonical fallback', () => {
    expect(
      vehicleColorLabel(
        {
          id: 'color-id',
          name: 'Pearl white',
          hexCode: '#ffffff',
          localizedNames: { ar: 'أبيض لؤلؤي' },
          isActive: true,
          sortOrder: 10,
        },
        'ar',
      ),
    ).toBe('أبيض لؤلؤي');
    expect(vehicleColorLabel({ id: 'color-id', name: 'Black', isActive: true, sortOrder: 20 }, 'ar')).toBe('Black');
  });

  it('validates image type and size before queueing uploads', () => {
    const valid = new File(['x'], 'vehicle.webp', { type: 'image/webp' });
    const invalidType = new File(['x'], 'vehicle.gif', { type: 'image/gif' });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'vehicle.png', {
      type: 'image/png',
    });

    expect(validateAdminImageFile(valid)).toBeNull();
    expect(validateAdminImageFile(invalidType)).toBe('Unsupported image type');
    expect(validateAdminImageFile(oversized)).toBe('Image exceeds 5 MB');
  });

  it('creates queue items and preserves deterministic reorder behavior', () => {
    const image = new File(['x'], 'vehicle.jpg', { type: 'image/jpeg' });
    const item = createImageQueueItem(image, () => 'blob:vehicle');
    const reordered = reorderQueue(['first', 'second', 'third'], 0, 2);

    expect(item.status).toBe('pending');
    expect(item.previewUrl).toBe('blob:vehicle');
    expect(reordered).toEqual(['second', 'third', 'first']);
  });
});
