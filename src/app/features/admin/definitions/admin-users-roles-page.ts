import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { AdminUserRolesDto, UsersRolesQueryParams } from '../../../core/showroom/showroom.models';
import { VehicleDefinitionApiService } from '../../../core/showroom/vehicle-definition-api.service';

@Component({
  selector: 'app-admin-users-roles-page',
  imports: [
    ButtonModule,
    DatePipe,
    FormsModule,
    InputTextModule,
    LucideAngularModule,
    RouterLink,
    SelectModule,
    TagModule,
    TranslatePipe,
  ],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'admin.usersRoles.kicker' | translate }}</span>
      <h1>{{ 'admin.usersRoles.title' | translate }}</h1>
      <p>{{ 'admin.usersRoles.copy' | translate }}</p>
      <p-button routerLink="/admin/definitions" [outlined]="true" icon="pi pi-arrow-left" [label]="'admin.definitions.back' | translate" />
    </section>

    <section class="users-roles-shell">
      <form class="users-roles-toolbar" (ngSubmit)="loadUsers()">
        <input pInputText type="search" name="q" [(ngModel)]="filters.q" [placeholder]="'admin.usersRoles.search' | translate" />
        <p-select [options]="roleOptions()" optionLabel="label" optionValue="value" name="role" [(ngModel)]="filters.role" [showClear]="true" [filter]="true" [placeholder]="'admin.usersRoles.roleFilter' | translate" />
        <p-select [options]="stateOptions" optionLabel="labelKey" optionValue="value" name="state" [(ngModel)]="filters.state" [placeholder]="'admin.usersRoles.stateFilter' | translate">
          <ng-template #item let-option>{{ option.labelKey | translate }}</ng-template>
          <ng-template #selectedItem let-option>{{ option?.labelKey | translate }}</ng-template>
        </p-select>
        <p-button type="submit" [outlined]="true" [label]="'admin.definitions.actions.filter' | translate" styleClass="gap-2">
          <lucide-icon name="search" size="18" />
        </p-button>
      </form>

      @if (error()) {
        <div class="state-panel error">{{ error() | translate }}</div>
      } @else if (loading()) {
        <div class="state-panel">{{ 'admin.usersRoles.states.loading' | translate }}</div>
      } @else if (users().length === 0) {
        <div class="state-panel">{{ 'admin.usersRoles.states.empty' | translate }}</div>
      } @else {
        <div class="users-roles-table-wrap">
          <table class="users-roles-table">
            <thead>
              <tr>
                <th>{{ 'admin.usersRoles.fields.user' | translate }}</th>
                <th>{{ 'admin.usersRoles.fields.roles' | translate }}</th>
                <th>{{ 'admin.usersRoles.fields.status' | translate }}</th>
                <th>{{ 'admin.usersRoles.fields.lastLogin' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <strong>{{ user.displayName }}</strong>
                    <span>{{ user.email }}</span>
                  </td>
                  <td>
                    <div class="chip-row">
                      @for (role of user.roles; track role.id) {
                        <span class="status-chip">{{ role.name }}</span>
                      } @empty {
                        <span>{{ 'admin.usersRoles.noRoles' | translate }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <p-tag [value]="(user.isActive ? 'admin.usersRoles.active' : 'admin.usersRoles.disabled') | translate" [severity]="user.isActive ? 'success' : 'secondary'" />
                  </td>
                  <td>{{ user.lastLoginAt ? (user.lastLoginAt | date: 'short') : ('admin.usersRoles.never' | translate) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .users-roles-shell {
        width: min(100%, var(--content-max));
        margin: 0 auto var(--space-8);
        display: grid;
        gap: var(--space-4);
      }

      .users-roles-toolbar {
        display: grid;
        gap: var(--space-3);
        padding: var(--space-4);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
      }

      .users-roles-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
      }

      .users-roles-table {
        width: 100%;
        border-collapse: collapse;
      }

      .users-roles-table th,
      .users-roles-table td {
        padding: var(--space-3);
        border-bottom: 1px solid var(--line);
        text-align: start;
        vertical-align: top;
      }

      .users-roles-table td > span {
        display: block;
        color: var(--muted);
        margin-top: var(--space-1);
      }

      @media (min-width: 900px) {
        .users-roles-toolbar {
          grid-template-columns: minmax(0, 1fr) 12rem 10rem auto;
          align-items: center;
        }
      }
    `,
  ],
})
export class AdminUsersRolesPage implements OnInit {
  private readonly api = inject(VehicleDefinitionApiService);
  readonly users = signal<AdminUserRolesDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly filters: UsersRolesQueryParams = { q: '', role: undefined, state: 'all' };
  readonly stateOptions = [
    { labelKey: 'admin.usersRoles.all', value: 'all' },
    { labelKey: 'admin.usersRoles.active', value: 'active' },
    { labelKey: 'admin.usersRoles.disabled', value: 'disabled' },
  ];
  readonly roleOptions = computed(() => {
    const roles = new Set(this.users().flatMap((user) => user.roles.map((role) => role.name)));

    return Array.from(roles)
      .sort((a, b) => a.localeCompare(b))
      .map((role) => ({ label: role, value: role }));
  });

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.users.set(await firstValueFrom(this.api.usersRoles(this.filters)));
    } catch {
      this.error.set('admin.usersRoles.errors.load');
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
