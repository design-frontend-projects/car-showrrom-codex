import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { CurrentProfile } from '../../core/auth/auth.models';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { formatDate } from '../../utils/date-format.util';

type ProfileStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-profile-page',
  imports: [AvatarModule, ButtonModule, RouterLink, SkeletonModule, TagModule, TranslatePipe],
  template: `
    <section class="profile-page" [attr.data-density]="density()">
      @if (status() === 'loading') {
        <div class="profile-summary profile-summary-loading" aria-live="polite">
          <p-skeleton shape="circle" size="5rem" />
          <div>
            <p-skeleton width="12rem" height="1.5rem" />
            <p-skeleton width="18rem" />
          </div>
        </div>
        <div class="profile-grid">
          @for (item of loadingCards; track item) {
            <section class="profile-section">
              <p-skeleton width="8rem" height="1.1rem" />
              <p-skeleton width="100%" height="4rem" />
            </section>
          }
        </div>
      } @else if (status() === 'error') {
        <div class="profile-state" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h1>{{ 'profile.errorTitle' | translate }}</h1>
          <p>{{ errorKey() | translate }}</p>
          <p-button [label]="'profile.retry' | translate" icon="pi pi-refresh" (onClick)="loadProfile()" />
        </div>
      } @else if (profile(); as currentProfile) {
        <div class="profile-summary">
          <p-avatar
            [image]="currentProfile.avatarUrl || undefined"
            [label]="currentProfile.avatarUrl ? undefined : initials(currentProfile.displayName)"
            shape="circle"
            size="xlarge"
          />

          <div class="profile-heading">
            <span class="eyebrow">{{ 'profile.kicker' | translate }}</span>
            <h1>{{ currentProfile.displayName }}</h1>
            <p>{{ currentProfile.email }}</p>
            <div class="profile-tags" aria-label="Account status">
              <p-tag
                [severity]="currentProfile.isActive ? 'success' : 'danger'"
                [value]="accountStatusLabel(currentProfile) | translate"
              />
              <p-tag
                [severity]="currentProfile.twoFactorEnabled ? 'success' : 'warn'"
                [value]="twoFactorLabel(currentProfile) | translate"
              />
            </div>
          </div>

          <div class="profile-actions">
            <p-button
              routerLink="/client/security"
              [label]="'profile.actions.security' | translate"
              icon="pi pi-shield"
              severity="secondary"
            />
            <p-button
              routerLink="/client/settings"
              [label]="'profile.actions.settings' | translate"
              icon="pi pi-cog"
              outlined
            />
          </div>
        </div>

        <div class="profile-grid">
          <section class="profile-section">
            <header>
              <i class="pi pi-id-card" aria-hidden="true"></i>
              <h2>{{ 'profile.sections.contact' | translate }}</h2>
            </header>
            <dl class="profile-list">
              <div>
                <dt>{{ 'profile.fields.displayName' | translate }}</dt>
                <dd>{{ currentProfile.displayName }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.email' | translate }}</dt>
                <dd>{{ currentProfile.email }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.phone' | translate }}</dt>
                <dd>{{ currentProfile.phone || ('profile.fallback.notProvided' | translate) }}</dd>
              </div>
            </dl>
          </section>

          <section class="profile-section">
            <header>
              <i class="pi pi-building" aria-hidden="true"></i>
              <h2>{{ 'profile.sections.workspace' | translate }}</h2>
            </header>
            <dl class="profile-list">
              <div>
                <dt>{{ 'profile.fields.tenant' | translate }}</dt>
                <dd>{{ currentProfile.tenant.name }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.tenantSlug' | translate }}</dt>
                <dd>{{ currentProfile.tenant.slug }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.roles' | translate }}</dt>
                <dd class="role-row">
                  @if (currentProfile.roles.length) {
                    @for (role of currentProfile.roles; track role) {
                      <span>{{ roleLabel(role) }}</span>
                    }
                  } @else {
                    {{ 'profile.fallback.noRoles' | translate }}
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section class="profile-section profile-section-emphasis">
            <header>
              <i class="pi pi-shield" aria-hidden="true"></i>
              <h2>{{ 'profile.sections.security' | translate }}</h2>
            </header>
            <dl class="profile-list">
              <div>
                <dt>{{ 'profile.fields.accountStatus' | translate }}</dt>
                <dd>{{ accountStatusLabel(currentProfile) | translate }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.twoFactor' | translate }}</dt>
                <dd>{{ twoFactorLabel(currentProfile) | translate }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.securityAction' | translate }}</dt>
                <dd>
                  <a routerLink="/client/security">{{ 'profile.actions.manageSecurity' | translate }}</a>
                </dd>
              </div>
            </dl>
          </section>

          <section class="profile-section">
            <header>
              <i class="pi pi-clock" aria-hidden="true"></i>
              <h2>{{ 'profile.sections.timeline' | translate }}</h2>
            </header>
            <dl class="profile-list">
              <div>
                <dt>{{ 'profile.fields.lastLogin' | translate }}</dt>
                <dd>{{ dateLabel(currentProfile.lastLoginAt) }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.createdAt' | translate }}</dt>
                <dd>{{ dateLabel(currentProfile.createdAt) }}</dd>
              </div>
              <div>
                <dt>{{ 'profile.fields.updatedAt' | translate }}</dt>
                <dd>{{ dateLabel(currentProfile.updatedAt) }}</dd>
              </div>
            </dl>
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .profile-page {
      display: grid;
      gap: 1.25rem;
    }

    .profile-summary {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 1rem;
      padding: clamp(1rem, 2vw, 1.5rem);
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-card, #fff);
    }

    .profile-summary-loading {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .profile-heading {
      min-width: 0;
    }

    .profile-heading h1 {
      margin: 0;
      font-size: clamp(1.65rem, 2.5vw, 2.5rem);
      line-height: 1.05;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }

    .profile-heading p {
      margin: 0.35rem 0 0;
      color: var(--text-color-secondary, #6b7280);
      overflow-wrap: anywhere;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 0.35rem;
      color: var(--text-color-secondary, #6b7280);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .profile-tags,
    .profile-actions,
    .role-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .profile-tags {
      margin-top: 0.85rem;
    }

    .profile-actions {
      justify-content: flex-end;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .profile-section {
      min-width: 0;
      padding: 1rem;
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-card, #fff);
    }

    .profile-section-emphasis {
      border-color: color-mix(in srgb, var(--primary-color, #111827) 22%, var(--surface-border, #e5e7eb));
    }

    .profile-section header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.85rem;
    }

    .profile-section header i {
      color: var(--primary-color, #111827);
    }

    .profile-section h2 {
      margin: 0;
      font-size: 1rem;
      letter-spacing: 0;
    }

    .profile-list {
      display: grid;
      gap: 0.85rem;
      margin: 0;
    }

    .profile-list div {
      min-width: 0;
    }

    .profile-list dt {
      margin-bottom: 0.2rem;
      color: var(--text-color-secondary, #6b7280);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .profile-list dd {
      margin: 0;
      min-width: 0;
      color: var(--text-color, #111827);
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .role-row span {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 999px;
      background: var(--surface-ground, #f9fafb);
      font-size: 0.8rem;
    }

    .profile-list a {
      color: var(--primary-color, #111827);
      font-weight: 750;
      text-decoration: none;
    }

    .profile-list a:focus-visible,
    .profile-list a:hover {
      text-decoration: underline;
      outline: none;
    }

    .profile-state {
      display: grid;
      justify-items: start;
      gap: 0.75rem;
      padding: 1.25rem;
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 8px;
      background: var(--surface-card, #fff);
    }

    .profile-state i {
      color: var(--red-500, #ef4444);
      font-size: 1.35rem;
    }

    .profile-state h1,
    .profile-state p {
      margin: 0;
    }

    .profile-state p {
      color: var(--text-color-secondary, #6b7280);
    }

    .profile-page[data-density='compact'] .profile-summary,
    .profile-page[data-density='medium'] .profile-summary {
      grid-template-columns: 1fr;
      justify-items: start;
    }

    .profile-page[data-density='compact'] .profile-actions,
    .profile-page[data-density='medium'] .profile-actions {
      justify-content: flex-start;
    }

    .profile-page[data-density='compact'] .profile-grid {
      grid-template-columns: 1fr;
    }

    @media (max-width: 720px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }

      .profile-actions {
        width: 100%;
      }
    }
  `],
})
export class ProfilePage {
  private readonly api = inject(AuthApiService);
  private readonly layout = inject(ResponsiveLayoutService);
  private readonly translate = inject(TranslateService);

  readonly profile = signal<CurrentProfile | null>(null);
  readonly status = signal<ProfileStatus>('loading');
  readonly errorKey = signal('profile.errors.requestFailed');
  readonly loadingCards = [0, 1, 2, 3];
  readonly density = computed(() => (this.layout.isDesktop() ? 'full' : this.layout.isTablet() ? 'medium' : 'compact'));

  constructor() {
    void this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.status.set('loading');
    this.profile.set(null);
    this.errorKey.set('profile.errors.requestFailed');

    try {
      this.profile.set(await firstValueFrom(this.api.profile()));
      this.status.set('ready');
    } catch (error) {
      this.errorKey.set(describeProfileError(error));
      this.status.set('error');
    }
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?';
  }

  accountStatusLabel(profile: CurrentProfile): string {
    return profile.isActive ? 'profile.status.active' : 'profile.status.inactive';
  }

  twoFactorLabel(profile: CurrentProfile): string {
    if (profile.twoFactorEnabled) {
      return 'profile.status.twoFactorEnabled';
    }

    return profile.twoFactorRequired ? 'profile.status.twoFactorRequired' : 'profile.status.twoFactorDisabled';
  }

  roleLabel(role: string): string {
    return role
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  dateLabel(value: string | null): string {
    if (!value) {
      return this.translate.instant('profile.fallback.notAvailable');
    }

    return formatDate(value, this.translate.currentLang || this.translate.defaultLang || 'en-US');
  }
}

function describeProfileError(error: unknown): string {
  if (isRecord(error) && isRecord(error['error']) && typeof error['error']['code'] === 'string') {
    return error['error']['code'] as string;
  }

  return 'profile.errors.requestFailed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
