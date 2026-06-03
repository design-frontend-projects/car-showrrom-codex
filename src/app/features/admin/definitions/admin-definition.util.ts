import { FormBuilder, Validators } from '@angular/forms';
import {
  VehicleDefinitionEntity,
  VehicleDefinitionInputDto,
  VehicleDefinitionRecord,
} from '../../../core/showroom/showroom.models';

export interface DefinitionConfig {
  entity: VehicleDefinitionEntity;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  fields: readonly DefinitionField[];
}

export type DefinitionField =
  | { key: keyof VehicleDefinitionInputDto; labelKey: string; type: 'text' | 'number'; required?: boolean }
  | { key: keyof VehicleDefinitionInputDto; labelKey: string; type: 'select'; options: DefinitionOptionSource; required?: boolean }
  | { key: keyof VehicleDefinitionInputDto; labelKey: string; type: 'checkbox' };

export type DefinitionOptionSource = 'makes' | 'models' | 'engines' | 'transmissions' | 'fuelTypes' | 'bodyTypes';

export const DEFINITION_CONFIGS: readonly DefinitionConfig[] = [
  {
    entity: 'makes',
    titleKey: 'admin.definitions.entities.makes.title',
    descriptionKey: 'admin.definitions.entities.makes.copy',
    icon: 'factory',
    fields: [
      { key: 'name', labelKey: 'admin.definitions.fields.name', type: 'text', required: true },
      { key: 'country', labelKey: 'admin.definitions.fields.country', type: 'text' },
      { key: 'isActive', labelKey: 'admin.definitions.fields.active', type: 'checkbox' },
    ],
  },
  {
    entity: 'models',
    titleKey: 'admin.definitions.entities.models.title',
    descriptionKey: 'admin.definitions.entities.models.copy',
    icon: 'car-front',
    fields: [
      { key: 'makeId', labelKey: 'admin.definitions.fields.make', type: 'select', options: 'makes', required: true },
      { key: 'name', labelKey: 'admin.definitions.fields.name', type: 'text', required: true },
      { key: 'productionFrom', labelKey: 'admin.definitions.fields.productionFrom', type: 'number' },
      { key: 'productionTo', labelKey: 'admin.definitions.fields.productionTo', type: 'number' },
      { key: 'isActive', labelKey: 'admin.definitions.fields.active', type: 'checkbox' },
    ],
  },
  {
    entity: 'trims',
    titleKey: 'admin.definitions.entities.trims.title',
    descriptionKey: 'admin.definitions.entities.trims.copy',
    icon: 'list-plus',
    fields: [
      { key: 'modelId', labelKey: 'admin.definitions.fields.model', type: 'select', options: 'models', required: true },
      { key: 'name', labelKey: 'admin.definitions.fields.name', type: 'text', required: true },
      { key: 'engineId', labelKey: 'admin.definitions.fields.engine', type: 'select', options: 'engines' },
      { key: 'transmissionId', labelKey: 'admin.definitions.fields.transmission', type: 'select', options: 'transmissions', required: true },
      { key: 'fuelTypeId', labelKey: 'admin.definitions.fields.fuelType', type: 'select', options: 'fuelTypes', required: true },
      { key: 'bodyTypeId', labelKey: 'admin.definitions.fields.bodyType', type: 'select', options: 'bodyTypes', required: true },
      { key: 'driveTrain', labelKey: 'admin.definitions.fields.driveTrain', type: 'text' },
      { key: 'isActive', labelKey: 'admin.definitions.fields.active', type: 'checkbox' },
    ],
  },
  ...(['engines', 'transmissions', 'fuel-types', 'body-types', 'conditions'] as const).map(catalogConfig),
];

export function getDefinitionConfig(entity: VehicleDefinitionEntity): DefinitionConfig {
  const config = DEFINITION_CONFIGS.find((item) => item.entity === entity);

  if (!config) {
    throw new Error(`Unsupported vehicle definition entity: ${entity}`);
  }

  return config;
}

export function createDefinitionForm(fb: FormBuilder, config: DefinitionConfig) {
  const controls: Record<string, unknown> = {};

  for (const field of config.fields) {
    controls[field.key] = [
      field.type === 'checkbox' ? true : '',
      'required' in field && field.required ? [Validators.required] : [],
    ];
  }

  return fb.group(controls);
}

export function patchDefinitionForm(form: ReturnType<FormBuilder['group']>, record: VehicleDefinitionRecord | null): void {
  if (!record) {
    form.reset({ isActive: true });
    return;
  }

  form.patchValue(record as unknown as Record<string, unknown>);
}

export function readDefinitionInput(formValue: Record<string, unknown>): VehicleDefinitionInputDto {
  return Object.fromEntries(
    Object.entries(formValue)
      .map(([key, value]) => [key, value === '' ? null : value])
      .filter((entry) => entry[1] !== undefined),
  ) as VehicleDefinitionInputDto;
}

export function entityToKey(entity: VehicleDefinitionEntity): string {
  return entity.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function catalogConfig(entity: Extract<VehicleDefinitionEntity, 'engines' | 'transmissions' | 'fuel-types' | 'body-types' | 'conditions'>): DefinitionConfig {
  return {
    entity,
    titleKey: `admin.definitions.entities.${entityToKey(entity)}.title`,
    descriptionKey: `admin.definitions.entities.${entityToKey(entity)}.copy`,
    icon: 'settings-2',
    fields: [
      { key: 'name', labelKey: 'admin.definitions.fields.name', type: 'text', required: true },
      { key: 'code', labelKey: 'admin.definitions.fields.code', type: 'text' },
      { key: 'description', labelKey: 'admin.definitions.fields.description', type: 'text' },
      { key: 'sortOrder', labelKey: 'admin.definitions.fields.sortOrder', type: 'number' },
      { key: 'isActive', labelKey: 'admin.definitions.fields.active', type: 'checkbox' },
    ],
  };
}
