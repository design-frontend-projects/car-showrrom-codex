import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaPath = resolve('prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf8');

const expectations = {
  CarMake: {
    map: 'car_makes',
    fields: ['id', 'tenantId', 'name', 'normalizedName', 'country', 'isActive', 'createdAt', 'updatedAt'],
    unique: ['@@unique([tenantId, id])', '@@unique([tenantId, normalizedName])'],
  },
  CarModel: {
    map: 'car_models',
    fields: ['id', 'tenantId', 'makeId', 'name', 'normalizedName', 'productionFrom', 'productionTo', 'isActive', 'createdAt', 'updatedAt'],
    unique: ['@@unique([tenantId, id])', '@@unique([tenantId, makeId, normalizedName])'],
  },
  CarVariant: {
    map: 'car_variants',
    fields: ['id', 'tenantId', 'modelId', 'engineId', 'transmissionId', 'fuelTypeId', 'bodyTypeId', 'name', 'normalizedName', 'bodyType', 'fuelType', 'transmission', 'isActive', 'createdAt', 'updatedAt'],
    unique: ['@@unique([tenantId, id])', '@@unique([tenantId, modelId, normalizedName])'],
  },
  VehicleEngine: {
    map: 'vehicle_engines',
    fields: catalogFields(),
    unique: catalogUnique(),
  },
  VehicleTransmission: {
    map: 'vehicle_transmissions',
    fields: catalogFields(),
    unique: catalogUnique(),
  },
  VehicleFuelType: {
    map: 'vehicle_fuel_types',
    fields: catalogFields(),
    unique: catalogUnique(),
  },
  VehicleBodyType: {
    map: 'vehicle_body_types',
    fields: catalogFields(),
    unique: catalogUnique(),
  },
  VehicleCondition: {
    map: 'vehicle_conditions',
    fields: catalogFields(),
    unique: catalogUnique(),
  },
  User: {
    map: 'users',
    fields: ['id', 'tenantId', 'email', 'displayName', 'phone', 'avatarUrl', 'isActive', 'twoFactorEnabled', 'twoFactorRequired', 'lastLoginAt', 'createdAt', 'updatedAt', 'roles'],
    unique: ['@@unique([tenantId, id])', '@@unique([tenantId, email])'],
  },
  Role: {
    map: 'roles',
    fields: ['id', 'tenantId', 'name', 'description', 'isSystem', 'createdAt', 'updatedAt', 'users'],
    unique: ['@@unique([tenantId, id])', '@@unique([tenantId, name])'],
  },
  UserRole: {
    map: 'user_roles',
    fields: ['id', 'tenantId', 'userId', 'roleId', 'assignedAt'],
    unique: ['@@unique([tenantId, userId, roleId])'],
  },
};

const errors = [];

for (const [modelName, expectation] of Object.entries(expectations)) {
  const block = readModelBlock(modelName);

  if (!block) {
    errors.push(`Missing model ${modelName} for frontend schema contract.`);
    continue;
  }

  if (!block.includes(`@@map("${expectation.map}")`)) {
    errors.push(`Model ${modelName} must map to table ${expectation.map}.`);
  }

  for (const field of expectation.fields) {
    if (!new RegExp(`^\\s*${escapeRegExp(field)}\\s+`, 'm').test(block)) {
      errors.push(`Model ${modelName} is missing required field ${field}.`);
    }
  }

  for (const unique of expectation.unique) {
    if (!block.includes(unique)) {
      errors.push(`Model ${modelName} is missing constraint ${unique}.`);
    }
  }
}

for (const [modelName, fieldName] of [
  ['CarVariant', 'engineId'],
  ['CarVariant', 'transmissionId'],
  ['CarVariant', 'fuelTypeId'],
  ['CarVariant', 'bodyTypeId'],
  ['CarListing', 'conditionId'],
]) {
  const block = readModelBlock(modelName);

  if (!block || !new RegExp(`^\\s*${fieldName}\\s+String\\?\\s+@map\\("`, 'm').test(block)) {
    errors.push(`Model ${modelName} must expose nullable catalog foreign key ${fieldName}.`);
  }
}

if (errors.length > 0) {
  console.error('Vehicle schema contract check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Vehicle schema contract check passed for ${Object.keys(expectations).length} models.`);

function readModelBlock(modelName) {
  const match = schema.match(new RegExp(`model\\s+${escapeRegExp(modelName)}\\s+\\{([\\s\\S]*?)\\n\\}`));
  return match?.[0] ?? null;
}

function catalogFields() {
  return ['id', 'tenantId', 'name', 'normalizedName', 'code', 'description', 'localizedNames', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'];
}

function catalogUnique() {
  return ['@@unique([tenantId, id])', '@@unique([tenantId, normalizedName])', '@@unique([tenantId, code])'];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
