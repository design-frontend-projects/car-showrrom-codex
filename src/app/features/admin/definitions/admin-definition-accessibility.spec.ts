import { readFileSync } from 'node:fs';
import { join } from 'node:path';

declare const process: { cwd(): string };

describe('admin definition accessibility hooks', () => {
  it('keeps definition CRUD feedback screen-reader friendly and localized', () => {
    const source = readSource('src/app/features/admin/definitions/admin-definition-entity-page.ts');

    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('admin.definitions.announcements.created');
    expect(source).toContain('admin.definitions.announcements.updated');
    expect(source).toContain('admin.definitions.announcements.deleted');
    expect(source).toContain("translate.instant('admin.definitions.confirmDeactivate')");
  });

  it('keeps admin definition navigation and user-role utility labelled and keyboard reachable', () => {
    const dashboard = readSource('src/app/features/admin/definitions/admin-definitions-page.ts');
    const usersRoles = readSource('src/app/features/admin/definitions/admin-users-roles-page.ts');

    expect(dashboard).toContain('aria-label="Vehicle definition sections"');
    expect(dashboard).toContain('routerLink');
    expect(usersRoles).toContain('<form class="users-roles-toolbar"');
    expect(usersRoles).toContain('<th>{{ \'admin.usersRoles.fields.user\' | translate }}</th>');
    expect(usersRoles).not.toContain('editRole');
  });

  it('renders color definition swatches and vehicle editor color dropdowns through localized controls', () => {
    const definitionEntity = readSource('src/app/features/admin/definitions/admin-definition-entity-page.ts');
    const vehicleEditor = readSource('src/app/features/admin/vehicles/admin-vehicle-editor-page.ts');

    expect(definitionEntity).toContain('color-swatch');
    expect(definitionEntity).toContain('admin.definitions.validation.hexColor');
    expect(vehicleEditor).toContain('formControlName="exteriorColorId"');
    expect(vehicleEditor).toContain('formControlName="interiorColorId"');
    expect(vehicleEditor).toContain('admin.vehicleEditor.color.emptyExterior');
    expect(vehicleEditor).toContain('admin.vehicleEditor.color.emptyInterior');
  });
});

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8');
}
