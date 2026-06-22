import { DatePipe, JsonPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RbacRole, RbacUser } from '../../../core/rbac/rbac.models';
import { RbacSignalStore } from '../../../state/rbac.store';

@Component({
  selector: 'app-rbac-users-page',
  imports: [ButtonModule, CardModule, DatePipe, DialogModule, FormsModule, InputTextModule, LucideAngularModule, SelectModule, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.users' | translate }}</span>
      <h1>{{ 'rbac.users.title' | translate }}</h1>
      <p>{{ 'rbac.users.copy' | translate }}</p>
    </section>

    <section class="rbac-workspace">
      <nav class="rbac-tabs" aria-label="RBAC sections">
        <a routerLink="/admin/rbac/users" class="active">{{ 'rbac.nav.users' | translate }}</a>
        <a routerLink="/admin/rbac/invitations">{{ 'rbac.nav.invitations' | translate }}</a>
        <a routerLink="/admin/rbac/roles">{{ 'rbac.nav.roles' | translate }}</a>
        <a routerLink="/admin/rbac/permissions">{{ 'rbac.nav.permissions' | translate }}</a>
        <a routerLink="/admin/rbac/audit">{{ 'rbac.nav.audit' | translate }}</a>
      </nav>

      <div class="rbac-toolbar">
        <div class="segmented-control" role="group" [attr.aria-label]="'rbac.users.filter' | translate">
          @for (option of userFilters; track option.value) {
            <button type="button" [class.active]="store.usersFilter() === option.value" (click)="loadUsers(option.value)">
              {{ option.labelKey | translate }}
            </button>
          }
        </div>
        <p-button [label]="'rbac.actions.createUser' | translate" (onClick)="openUserDialog()" styleClass="gap-2">
          <lucide-icon name="user-plus" size="18" />
        </p-button>
        <p-button [label]="'rbac.actions.invite' | translate" [outlined]="true" (onClick)="inviteDialogOpen.set(true)" styleClass="gap-2">
          <lucide-icon name="key-round" size="18" />
        </p-button>
      </div>

      @if (store.error()) {
        <div class="state-panel error">{{ store.error() | translate }}</div>
      } @else if (store.usersStatus() === 'loading') {
        <div class="state-panel">{{ 'rbac.states.loading' | translate }}</div>
      } @else if (store.users().length === 0) {
        <div class="state-panel">{{ 'rbac.users.empty' | translate }}</div>
      } @else {
        <div class="rbac-table-wrap">
          <table class="rbac-table">
            <thead>
              <tr>
                <th>{{ 'rbac.fields.user' | translate }}</th>
                <th>{{ 'rbac.fields.roles' | translate }}</th>
                <th>{{ 'rbac.fields.status' | translate }}</th>
                <th>{{ 'rbac.fields.lastLogin' | translate }}</th>
                <th>{{ 'rbac.fields.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (user of store.users(); track user.id) {
                <tr>
                  <td>
                    <strong>{{ user.displayName }}</strong>
                    <span>{{ user.email }}</span>
                  </td>
                  <td>
                    <div class="chip-row">
                      @for (role of user.roles; track role.id) {
                        <span class="status-chip">{{ role.name }}</span>
                      }
                    </div>
                  </td>
                  <td><span class="status-chip" [class.danger]="!user.isActive">{{ (user.isActive ? 'rbac.status.active' : 'rbac.status.disabled') | translate }}</span></td>
                  <td>{{ user.lastLoginAt ? (user.lastLoginAt | date: 'short') : ('rbac.fallback.never' | translate) }}</td>
                  <td>
                    <div class="icon-actions">
                      <button type="button" [title]="'rbac.actions.edit' | translate" (click)="openUserDialog(user)">
                        <lucide-icon name="pencil" size="17" />
                      </button>
                      @if (user.isActive) {
                        <button type="button" [title]="'rbac.actions.disable' | translate" (click)="disableUser(user)">
                          <lucide-icon name="lock-keyhole" size="17" />
                        </button>
                      } @else {
                        <button type="button" [title]="'rbac.actions.enable' | translate" (click)="store.enableUser(user.id)">
                          <lucide-icon name="check" size="17" />
                        </button>
                      }
                      <button type="button" [title]="'rbac.actions.reset' | translate" [disabled]="!user.isActive" (click)="resetUser(user)">
                        <lucide-icon name="rotate-ccw" size="17" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <p-dialog [header]="editingUser() ? ('rbac.actions.editUser' | translate) : ('rbac.actions.createUser' | translate)" [visible]="userDialogOpen()" (visibleChange)="userDialogOpen.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(94vw, 42rem)' }">
      <form class="rbac-form" (ngSubmit)="saveUser()">
        <label>{{ 'rbac.fields.displayName' | translate }}<input pInputText name="displayName" [(ngModel)]="userForm.displayName" required /></label>
        <label>{{ 'rbac.fields.email' | translate }}<input pInputText name="email" type="email" [(ngModel)]="userForm.email" required /></label>
        <label>{{ 'rbac.fields.phone' | translate }}<input pInputText name="phone" [(ngModel)]="userForm.phone" /></label>
        @if (!editingUser()) {
          <label>{{ 'rbac.fields.initialPassword' | translate }}<input pInputText name="initialPassword" type="password" [(ngModel)]="userForm.initialPassword" /></label>
        }
        <div class="check-grid">
          @for (role of store.roles(); track role.id) {
            <label><input type="checkbox" [checked]="roleSelected(role.id)" (change)="toggleRole(role.id)" /> {{ role.name }}</label>
          }
        </div>
        <div class="button-row">
          <p-button type="submit" [label]="'rbac.actions.save' | translate" />
          <p-button type="button" [label]="'rbac.actions.cancel' | translate" [outlined]="true" (onClick)="userDialogOpen.set(false)" />
        </div>
      </form>
    </p-dialog>

    <p-dialog [header]="'rbac.actions.invite' | translate" [visible]="inviteDialogOpen()" (visibleChange)="inviteDialogOpen.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(94vw, 38rem)' }">
      <form class="rbac-form" (ngSubmit)="saveInvitation()">
        <label>{{ 'rbac.fields.email' | translate }}<input pInputText name="inviteEmail" type="email" [(ngModel)]="inviteForm.email" required /></label>
        <label>{{ 'rbac.fields.displayName' | translate }}<input pInputText name="inviteName" [(ngModel)]="inviteForm.displayName" /></label>
        <div class="check-grid">
          @for (role of store.roles(); track role.id) {
            <label><input type="checkbox" [checked]="inviteRoleIds().has(role.id)" (change)="toggleInviteRole(role.id)" /> {{ role.name }}</label>
          }
        </div>
        <div class="button-row">
          <p-button type="submit" [label]="'rbac.actions.sendInvite' | translate" />
          <p-button type="button" [label]="'rbac.actions.cancel' | translate" [outlined]="true" (onClick)="inviteDialogOpen.set(false)" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class RbacUsersPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  private readonly translate = inject(TranslateService);
  readonly userDialogOpen = signal(false);
  readonly inviteDialogOpen = signal(false);
  readonly editingUser = signal<RbacUser | null>(null);
  readonly selectedRoleIds = signal(new Set<string>());
  readonly inviteRoleIds = signal(new Set<string>());
  readonly userFilters = [
    { labelKey: 'rbac.status.all', value: 'all' as const },
    { labelKey: 'rbac.status.active', value: 'active' as const },
    { labelKey: 'rbac.status.disabled', value: 'disabled' as const },
  ];
  userForm = createUserForm();
  inviteForm = { email: '', displayName: '' };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.store.loadUsers(), this.store.loadRoles()]);
  }

  loadUsers(state: 'active' | 'disabled' | 'all'): void {
    void this.store.loadUsers(state);
  }

  openUserDialog(user?: RbacUser): void {
    this.editingUser.set(user ?? null);
    this.userForm = user
      ? { email: user.email, displayName: user.displayName, phone: user.phone ?? '', initialPassword: '' }
      : createUserForm();
    this.selectedRoleIds.set(new Set(user?.roles.map((role) => role.id) ?? []));
    this.userDialogOpen.set(true);
  }

  roleSelected(roleId: string): boolean {
    return this.selectedRoleIds().has(roleId);
  }

  toggleRole(roleId: string): void {
    this.selectedRoleIds.set(toggleSet(this.selectedRoleIds(), roleId));
  }

  toggleInviteRole(roleId: string): void {
    this.inviteRoleIds.set(toggleSet(this.inviteRoleIds(), roleId));
  }

  async saveUser(): Promise<void> {
    const roleIds = Array.from(this.selectedRoleIds());
    const user = this.editingUser();

    if (user) {
      await this.store.updateUser(user.id, { ...this.userForm, roleIds });
    } else {
      await this.store.createUser({ ...this.userForm, roleIds, generatePassword: !this.userForm.initialPassword });
    }

    this.userDialogOpen.set(false);
  }

  async saveInvitation(): Promise<void> {
    await this.store.inviteUser({ ...this.inviteForm, roleIds: Array.from(this.inviteRoleIds()) });
    this.inviteDialogOpen.set(false);
  }

  disableUser(user: RbacUser): void {
    if (window.confirm(this.translate.instant('rbac.dialogs.disableUser'))) {
      void this.store.disableUser(user.id);
    }
  }

  resetUser(user: RbacUser): void {
    if (window.confirm(this.translate.instant('rbac.dialogs.resetUser'))) {
      void this.store.initiateReset(user.id);
    }
  }
}

@Component({
  selector: 'app-rbac-invitations-page',
  imports: [ButtonModule, CardModule, DatePipe, FormsModule, InputTextModule, LucideAngularModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.invitations' | translate }}</span>
      <h1>{{ 'rbac.invitations.title' | translate }}</h1>
      <p>{{ 'rbac.invitations.copy' | translate }}</p>
    </section>
    <section class="rbac-workspace">
      <div class="rbac-toolbar">
        <nav class="rbac-tabs" aria-label="RBAC sections">
          <a routerLink="/admin/rbac/users">{{ 'rbac.nav.users' | translate }}</a>
          <a routerLink="/admin/rbac/invitations" class="active">{{ 'rbac.nav.invitations' | translate }}</a>
          <a routerLink="/admin/rbac/roles">{{ 'rbac.nav.roles' | translate }}</a>
          <a routerLink="/admin/rbac/permissions">{{ 'rbac.nav.permissions' | translate }}</a>
          <a routerLink="/admin/rbac/audit">{{ 'rbac.nav.audit' | translate }}</a>
        </nav>
      </div>
      <div class="rbac-toolbar">
        <div class="segmented-control" role="group" [attr.aria-label]="'rbac.invitations.filter' | translate">
          @for (option of statusFilters; track option.value) {
            <button type="button" [class.active]="statusFilter() === option.value" (click)="statusFilter.set(option.value)">
              {{ option.labelKey | translate }}
            </button>
          }
        </div>
        <input
          pInputText
          type="search"
          [ngModel]="searchText()"
          (ngModelChange)="searchText.set($event)"
          [placeholder]="'rbac.invitations.search' | translate"
        />
      </div>

      @if (store.error()) {
        <div class="state-panel error">{{ store.error() | translate }}</div>
      } @else if (store.invitationsStatus() === 'loading') {
        <div class="state-panel">{{ 'rbac.invitations.loading' | translate }}</div>
      } @else if (filteredInvitations().length === 0) {
        <div class="state-panel">{{ 'rbac.invitations.empty' | translate }}</div>
      } @else {
        <div class="rbac-table-wrap">
        <table class="rbac-table">
          <thead>
            <tr>
              <th>{{ 'rbac.fields.user' | translate }}</th>
              <th>{{ 'rbac.fields.roles' | translate }}</th>
              <th>{{ 'rbac.fields.status' | translate }}</th>
              <th>{{ 'rbac.fields.inviter' | translate }}</th>
              <th>{{ 'rbac.fields.resultingUser' | translate }}</th>
              <th>{{ 'rbac.fields.timestamps' | translate }}</th>
              <th>{{ 'rbac.fields.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (invitation of filteredInvitations(); track invitation.id) {
              <tr>
                <td><strong>{{ invitation.displayName || invitation.email }}</strong><span>{{ invitation.email }}</span></td>
                <td>
                  <div class="chip-row">
                    @for (role of invitation.targetRoles; track role.id) {
                      <span class="status-chip">{{ role.name }}</span>
                    } @empty {
                      <span>{{ 'rbac.fallback.noRoles' | translate }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="status-chip" [class.danger]="invitation.status === 'revoked' || invitation.isExpired">
                    {{ statusLabel(invitation.status, invitation.isExpired) | translate }}
                  </span>
                </td>
                <td><strong>{{ invitation.inviter?.displayName || ('rbac.fallback.system' | translate) }}</strong><span>{{ invitation.inviter?.email }}</span></td>
                <td>
                  @if (invitation.resultingUser) {
                    <strong>{{ invitation.resultingUser.displayName }}</strong><span>{{ invitation.resultingUser.email }}</span>
                  } @else {
                    <span>{{ 'rbac.fallback.notAccepted' | translate }}</span>
                  }
                </td>
                <td>
                  <strong>{{ 'rbac.fields.expiresAt' | translate }}: {{ invitation.expiresAt | date: 'short' }}</strong>
                  <span>{{ 'rbac.fields.acceptedAt' | translate }}: {{ invitation.acceptedAt ? (invitation.acceptedAt | date: 'short') : ('rbac.fallback.never' | translate) }}</span>
                  <span>{{ 'rbac.fields.revokedAt' | translate }}: {{ invitation.revokedAt ? (invitation.revokedAt | date: 'short') : ('rbac.fallback.never' | translate) }}</span>
                  <span>{{ 'rbac.fields.resentAt' | translate }}: {{ invitation.resentAt ? (invitation.resentAt | date: 'short') : ('rbac.fallback.never' | translate) }}</span>
                </td>
                <td>
                  <div class="icon-actions">
                    <button type="button" [title]="'rbac.actions.resend' | translate" [disabled]="!invitation.canResend" (click)="resend(invitation.id)">
                      <lucide-icon name="refresh-cw" size="17" />
                    </button>
                    <button type="button" [title]="'rbac.actions.revoke' | translate" [disabled]="!invitation.canRevoke" (click)="revoke(invitation.id)">
                      <lucide-icon name="x" size="17" />
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      }
    </section>
  `,
})
export class RbacInvitationsPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  private readonly translate = inject(TranslateService);
  readonly statusFilter = signal<'all' | 'pending' | 'accepted' | 'revoked' | 'expired'>('all');
  readonly searchText = signal('');
  readonly statusFilters = [
    { labelKey: 'rbac.status.all', value: 'all' as const },
    { labelKey: 'rbac.invitationStatus.pending', value: 'pending' as const },
    { labelKey: 'rbac.invitationStatus.accepted', value: 'accepted' as const },
    { labelKey: 'rbac.invitationStatus.revoked', value: 'revoked' as const },
    { labelKey: 'rbac.invitationStatus.expired', value: 'expired' as const },
  ];
  readonly filteredInvitations = computed(() => {
    const status = this.statusFilter();
    const query = this.searchText().trim().toLowerCase();

    return this.store.invitations().filter((invitation) => {
      const statusMatches =
        status === 'all' ||
        (status === 'expired' ? invitation.isExpired : invitation.status === status);
      const textMatches =
        !query ||
        invitation.email.toLowerCase().includes(query) ||
        (invitation.displayName ?? '').toLowerCase().includes(query) ||
        invitation.targetRoles.some((role) => role.name.toLowerCase().includes(query)) ||
        (invitation.resultingUser?.email ?? '').toLowerCase().includes(query);

      return statusMatches && textMatches;
    });
  });

  ngOnInit(): void {
    void this.store.loadInvitations();
  }

  revoke(invitationId: string): void {
    if (window.confirm(this.translate.instant('rbac.dialogs.revokeInvitation'))) {
      void this.store.revokeInvitation(invitationId);
    }
  }

  resend(invitationId: string): void {
    if (window.confirm(this.translate.instant('rbac.dialogs.resendInvitation'))) {
      void this.store.resendInvitation(invitationId);
    }
  }

  statusLabel(status: string, expired: boolean): string {
    return expired && status === 'pending'
      ? 'rbac.invitationStatus.expired'
      : `rbac.invitationStatus.${status}`;
  }
}

@Component({
  selector: 'app-rbac-roles-page',
  imports: [ButtonModule, DatePipe, DialogModule, FormsModule, InputTextModule, LucideAngularModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.roles' | translate }}</span>
      <h1>{{ 'rbac.roles.title' | translate }}</h1>
      <p>{{ 'rbac.roles.copy' | translate }}</p>
    </section>
    <section class="rbac-workspace">
      <div class="rbac-toolbar"><p-button [label]="'rbac.actions.createRole' | translate" (onClick)="openRoleDialog()" /></div>
      <div class="rbac-table-wrap">
        <table class="rbac-table">
          <thead><tr><th>{{ 'rbac.fields.role' | translate }}</th><th>{{ 'rbac.fields.permissions' | translate }}</th><th>{{ 'rbac.fields.updatedAt' | translate }}</th><th>{{ 'rbac.fields.actions' | translate }}</th></tr></thead>
          <tbody>
            @for (role of store.roles(); track role.id) {
              <tr>
                <td><strong><a [routerLink]="['/admin/rbac/roles', role.id]">{{ role.name }}</a></strong><span>{{ role.description }}</span></td>
                <td>{{ role.permissions.length }}</td>
                <td>{{ role.updatedAt | date: 'short' }}</td>
                <td>
                  <div class="icon-actions">
                    <button type="button" (click)="openRoleDialog(role)"><lucide-icon name="pencil" size="17" /></button>
                    <button type="button" [disabled]="role.isSystem" (click)="deleteRole(role)"><lucide-icon name="trash-2" size="17" /></button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <p-dialog [header]="editingRole() ? ('rbac.actions.editRole' | translate) : ('rbac.actions.createRole' | translate)" [visible]="roleDialogOpen()" (visibleChange)="roleDialogOpen.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(94vw, 34rem)' }">
      <form class="rbac-form" (ngSubmit)="saveRole()">
        <label>{{ 'rbac.fields.name' | translate }}<input pInputText name="roleName" [(ngModel)]="roleForm.name" required [disabled]="editingRole()?.isSystem === true" /></label>
        <label>{{ 'rbac.fields.description' | translate }}<input pInputText name="roleDescription" [(ngModel)]="roleForm.description" /></label>
        @if (editingRole()?.isSystem) {
          <div class="state-panel">{{ 'rbac.roles.systemProtected' | translate }}</div>
        }
        <div class="button-row">
          <p-button type="submit" [label]="'rbac.actions.save' | translate" />
          <p-button type="button" [label]="'rbac.actions.cancel' | translate" [outlined]="true" (onClick)="roleDialogOpen.set(false)" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class RbacRolesPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  private readonly translate = inject(TranslateService);
  readonly roleDialogOpen = signal(false);
  readonly editingRole = signal<RbacRole | null>(null);
  roleForm = { name: '', description: '' };

  ngOnInit(): void {
    void this.store.loadRoles();
  }

  openRoleDialog(role?: RbacRole): void {
    this.editingRole.set(role ?? null);
    this.roleForm = { name: role?.name ?? '', description: role?.description ?? '' };
    this.roleDialogOpen.set(true);
  }

  async saveRole(): Promise<void> {
    const role = this.editingRole();
    if (role) {
      await this.store.updateRole(role.id, this.roleForm);
    } else {
      await this.store.createRole(this.roleForm);
    }
    this.roleDialogOpen.set(false);
  }

  deleteRole(role: RbacRole): void {
    if (!role.isSystem && window.confirm(this.translate.instant('rbac.dialogs.deleteRole'))) {
      void this.store.deleteRole(role.id);
    }
  }
}

@Component({
  selector: 'app-rbac-role-detail-page',
  imports: [ButtonModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.roles' | translate }}</span>
      <h1>{{ store.selectedRole()?.name }}</h1>
      <p>{{ store.selectedRole()?.description || ('rbac.roles.noDescription' | translate) }}</p>
    </section>
    <section class="rbac-workspace">
      <a routerLink="/admin/rbac/roles" class="text-link">{{ 'rbac.actions.backToRoles' | translate }}</a>
      @if (store.selectedRole()?.isSystem) {
        <div class="state-panel">{{ 'rbac.roles.systemProtected' | translate }}</div>
      }
      <div class="rbac-panel">
        <h2>{{ 'rbac.roles.assignedUsers' | translate }}</h2>
        <div class="chip-row">
          @for (user of store.selectedRole()?.assignedUsers ?? []; track user.id) {
            <span class="status-chip">{{ user.displayName }}</span>
          } @empty {
            <span>{{ 'rbac.roles.noAssignedUsers' | translate }}</span>
          }
        </div>
      </div>
    </section>
  `,
})
export class RbacRoleDetailPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('roleId');
    if (roleId) {
      void this.store.loadRoleDetail(roleId);
    }
  }
}

@Component({
  selector: 'app-rbac-permissions-page',
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, LucideAngularModule, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.permissions' | translate }}</span>
      <h1>{{ 'rbac.permissions.title' | translate }}</h1>
      <p>{{ 'rbac.permissions.copy' | translate }}</p>
    </section>
    <section class="rbac-workspace">
      <div class="rbac-toolbar"><p-button [label]="'rbac.actions.createPermission' | translate" (onClick)="permissionDialogOpen.set(true)" /></div>
      @for (group of store.permissionGroups(); track group.key) {
        <div class="rbac-panel">
          <h2>{{ group.label }}</h2>
          <div class="rbac-table-wrap">
            <table class="rbac-table matrix">
              <thead>
                <tr><th>{{ 'rbac.fields.permission' | translate }}</th>@for (role of store.roles(); track role.id) { <th>{{ role.name }}</th> }</tr>
              </thead>
              <tbody>
                @for (permission of group.permissions; track permission.id) {
                  <tr>
                    <td><strong>{{ permission.action }}</strong><span>{{ permission.description }}</span></td>
                    @for (role of store.roles(); track role.id) {
                      <td><input type="checkbox" [checked]="roleHasPermission(role, permission.id)" (change)="togglePermission(role, permission.id)" [attr.aria-label]="role.name + ' ' + permission.action" /></td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @empty {
        <div class="state-panel">{{ 'rbac.permissions.empty' | translate }}</div>
      }
    </section>
    <p-dialog [header]="'rbac.actions.createPermission' | translate" [visible]="permissionDialogOpen()" (visibleChange)="permissionDialogOpen.set($event)" [modal]="true" [draggable]="false" [style]="{ width: 'min(94vw, 34rem)' }">
      <form class="rbac-form" (ngSubmit)="savePermission()">
        <label>{{ 'rbac.fields.action' | translate }}<input pInputText name="permissionAction" [(ngModel)]="permissionForm.action" required /></label>
        <label>{{ 'rbac.fields.description' | translate }}<input pInputText name="permissionDescription" [(ngModel)]="permissionForm.description" /></label>
        <div class="button-row">
          <p-button type="submit" [label]="'rbac.actions.save' | translate" />
          <p-button type="button" [label]="'rbac.actions.cancel' | translate" [outlined]="true" (onClick)="permissionDialogOpen.set(false)" />
        </div>
      </form>
    </p-dialog>
  `,
})
export class RbacPermissionsPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  readonly permissionDialogOpen = signal(false);
  permissionForm = { action: '', description: '' };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.store.loadRoles(), this.store.loadPermissions()]);
  }

  roleHasPermission(role: RbacRole, permissionId: string): boolean {
    return role.permissions.some((permission) => permission.id === permissionId);
  }

  togglePermission(role: RbacRole, permissionId: string): void {
    if (this.roleHasPermission(role, permissionId)) {
      void this.store.removePermission(role.id, permissionId);
    } else {
      void this.store.assignPermission(role.id, permissionId);
    }
  }

  async savePermission(): Promise<void> {
    await this.store.createPermission(this.permissionForm);
    this.permissionForm = { action: '', description: '' };
    this.permissionDialogOpen.set(false);
  }
}

@Component({
  selector: 'app-rbac-audit-page',
  imports: [ButtonModule, DatePipe, JsonPipe, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.nav.audit' | translate }}</span>
      <h1>{{ 'rbac.audit.title' | translate }}</h1>
      <p>{{ 'rbac.audit.copy' | translate }}</p>
    </section>
    <section class="rbac-workspace">
      <div class="rbac-table-wrap">
        <table class="rbac-table">
          <thead><tr><th>{{ 'rbac.fields.actor' | translate }}</th><th>{{ 'rbac.fields.action' | translate }}</th><th>{{ 'rbac.fields.target' | translate }}</th><th>{{ 'rbac.fields.timestamp' | translate }}</th><th>{{ 'rbac.fields.metadata' | translate }}</th></tr></thead>
          <tbody>
            @for (event of store.auditEvents(); track event.id) {
              <tr>
                <td><strong>{{ event.actor?.displayName || 'System' }}</strong><span>{{ event.actor?.email }}</span></td>
                <td>{{ event.action }}</td>
                <td>{{ event.targetType }} {{ event.targetId }}</td>
                <td>{{ event.createdAt | date: 'medium' }}</td>
                <td><code>{{ event.metadata | json }}</code></td>
              </tr>
            } @empty {
              <tr><td colspan="5">{{ 'rbac.audit.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="pagination-row">
        <p-button [label]="'rbac.actions.previous' | translate" [disabled]="store.auditPage().page <= 1" [outlined]="true" (onClick)="page(-1)" />
        <span>{{ store.auditPage().page }} / {{ totalPages() }}</span>
        <p-button [label]="'rbac.actions.next' | translate" [disabled]="store.auditPage().page >= totalPages()" [outlined]="true" (onClick)="page(1)" />
      </div>
    </section>
  `,
})
export class RbacAuditPage implements OnInit {
  readonly store = inject(RbacSignalStore);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.store.auditPage().total / this.store.auditPage().pageSize)));

  ngOnInit(): void {
    void this.store.loadAudit();
  }

  page(delta: number): void {
    const page = this.store.auditPage().page + delta;
    void this.store.loadAudit({ ...this.store.auditFilter(), page });
  }
}

@Component({
  selector: 'app-admin-access-denied-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'rbac.access.kicker' | translate }}</span>
      <h1>{{ 'rbac.access.title' | translate }}</h1>
      <p>{{ 'rbac.access.copy' | translate }}</p>
      <a routerLink="/" class="text-link">{{ 'rbac.actions.safeFallback' | translate }}</a>
    </section>
  `,
})
export class AdminAccessDeniedPage {}

function createUserForm() {
  return { email: '', displayName: '', phone: '', initialPassword: '' };
}

function toggleSet(values: Set<string>, value: string): Set<string> {
  const next = new Set(values);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
