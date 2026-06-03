import { FormBuilder } from '@angular/forms';
import {
  createDefinitionForm,
  entityToKey,
  getDefinitionConfig,
  patchDefinitionForm,
  readDefinitionInput,
} from './admin-definition.util';

describe('admin definition utilities', () => {
  const fb = new FormBuilder();

  it('maps dashed API entities to translation key segments', () => {
    expect(entityToKey('fuel-types')).toBe('fuelTypes');
    expect(entityToKey('body-types')).toBe('bodyTypes');
    expect(entityToKey('transmissions')).toBe('transmissions');
  });

  it('builds required validators for parent-child definition forms', () => {
    const modelConfig = getDefinitionConfig('models');
    const form = createDefinitionForm(fb, modelConfig);

    form.patchValue({ name: '', makeId: '' });

    expect(form.valid).toBe(false);
    expect(form.controls['name'].hasError('required')).toBe(true);
    expect(form.controls['makeId'].hasError('required')).toBe(true);

    form.patchValue({ name: 'Camry', makeId: 'make-id' });

    expect(form.valid).toBe(true);
  });

  it('resets create forms to active and patches edit forms from records', () => {
    const makeConfig = getDefinitionConfig('makes');
    const form = createDefinitionForm(fb, makeConfig);

    patchDefinitionForm(form, null);

    expect(form.value['isActive']).toBe(true);

    patchDefinitionForm(form, {
      id: 'make-id',
      name: 'Toyota',
      normalizedName: 'toyota',
      country: 'Japan',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(form.value['name']).toBe('Toyota');
    expect(form.value['country']).toBe('Japan');
    expect(form.value['isActive']).toBe(false);
  });

  it('normalizes empty form values without dropping valid false and zero values', () => {
    expect(
      readDefinitionInput({
        name: 'Automatic',
        code: '',
        sortOrder: 0,
        isActive: false,
        description: undefined,
      }),
    ).toEqual({
      name: 'Automatic',
      code: null,
      sortOrder: 0,
      isActive: false,
    });
  });
});
