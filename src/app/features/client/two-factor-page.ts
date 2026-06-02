import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { minLength, pattern, required, schema } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthFacade } from '../../core/auth/auth.facade';
import { createSignalForm } from '../../utils/signal-form.util';

interface TwoFactorManageModel {
  code: string;
  backupCode: string;
  password: string;
}

const manageSchema = schema<TwoFactorManageModel>((path) => {
  pattern(path.code, /^[0-9]{6,8}$/, { message: 'auth.validation.otp.format' });
  minLength(path.backupCode, 8, { message: 'auth.validation.backupCode.minLength' });
  required(path.password, { message: 'auth.validation.password.required' });
});

@Component({
  selector: 'app-two-factor-page',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <section class="auth-page">
      <div class="page-header">
        <span class="eyebrow">{{ 'auth.twoFactor.eyebrow' | translate }}</span>
        <h1>{{ 'auth.twoFactor.settingsTitle' | translate }}</h1>
        <p>{{ 'auth.twoFactor.settingsCopy' | translate }}</p>
      </div>

      @if (auth.error(); as error) {
        <p class="form-error">{{ error | translate }}</p>
      }

      @if (!auth.user()?.twoFactorEnabled) {
        <form class="contact-form" (ngSubmit)="verifySetup()">
          <p-button type="button" [label]="'auth.twoFactor.startSetup' | translate" icon="pi pi-qrcode" (onClick)="startSetup()" />
          @if (qrCode()) {
            <img class="qr-code" [src]="qrCode()" [alt]="'auth.twoFactor.qrAlt' | translate" />
            <input
              pInputText
              name="setupCode"
              inputmode="numeric"
              [ngModel]="model().code"
              (ngModelChange)="update('code', $event)"
              [placeholder]="'auth.twoFactor.code' | translate"
              autocomplete="one-time-code"
            />
            <p-button type="submit" [label]="'auth.twoFactor.enable' | translate" icon="pi pi-shield" [disabled]="!canSubmitCode()" />
          }
        </form>
      } @else {
        <form class="contact-form" (ngSubmit)="disable()">
          <input
            pInputText
            name="password"
            type="password"
            [ngModel]="model().password"
            (ngModelChange)="update('password', $event)"
            [placeholder]="'auth.password' | translate"
            autocomplete="current-password"
          />
          <input
            pInputText
            name="code"
            inputmode="numeric"
            [ngModel]="model().code"
            (ngModelChange)="update('code', $event)"
            [placeholder]="'auth.twoFactor.code' | translate"
            autocomplete="one-time-code"
          />
          <input
            pInputText
            name="backupCode"
            [ngModel]="model().backupCode"
            (ngModelChange)="update('backupCode', $event)"
            [placeholder]="'auth.twoFactor.backupCode' | translate"
          />
          <div class="security-actions">
            <p-button type="submit" severity="danger" [label]="'auth.twoFactor.disable' | translate" icon="pi pi-lock-open" [disabled]="!canManage()" />
            <p-button
              type="button"
              severity="secondary"
              [label]="'auth.twoFactor.regenerateBackupCodes' | translate"
              icon="pi pi-refresh"
              [disabled]="!canManage()"
              (onClick)="regenerateBackupCodes()"
            />
          </div>
        </form>
      }

      @if (backupCodes().length > 0) {
        <div class="backup-codes" aria-live="polite">
          <h2>{{ 'auth.twoFactor.backupCodesTitle' | translate }}</h2>
          @for (code of backupCodes(); track code) {
            <code>{{ code }}</code>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .form-error {
        color: var(--accent);
        font-weight: 800;
      }

      .qr-code {
        width: min(14rem, 72vw);
        aspect-ratio: 1;
        object-fit: contain;
      }

      .security-actions,
      .backup-codes {
        display: grid;
        gap: var(--space-3);
      }

      .backup-codes {
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
      }

      .backup-codes h2 {
        grid-column: 1 / -1;
        margin: 0;
        font-size: 1rem;
      }

      .backup-codes code {
        padding: 0.75rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow-wrap: anywhere;
      }
    `
  ]
})
export class TwoFactorPage {
  readonly auth = inject(AuthFacade);
  readonly qrCode = signal<string | null>(null);
  readonly backupCodes = signal<string[]>([]);
  readonly form = createSignalForm<TwoFactorManageModel>({ code: '', backupCode: '', password: '' }, manageSchema);
  readonly model = this.form.model;
  readonly canSubmitCode = computed(() => /^[0-9]{6,8}$/.test(this.model().code));
  readonly canManage = computed(() => this.model().password.length > 0 && (this.model().code.length >= 6 || this.model().backupCode.length >= 8));

  update(field: keyof TwoFactorManageModel, value: string): void {
    this.model.update((current) => ({ ...current, [field]: value }));
  }

  async startSetup(): Promise<void> {
    const setup = await this.auth.startTwoFactorSetup();
    this.qrCode.set(setup?.qrCodeDataUrl ?? null);
  }

  async verifySetup(): Promise<void> {
    const response = await this.auth.verifyTwoFactor({ code: this.model().code });

    if (response && 'backupCodes' in response) {
      this.backupCodes.set(response.backupCodes);
      await this.auth.loadSession();
    }
  }

  async disable(): Promise<void> {
    if (await this.auth.disableTwoFactor(this.managementPayload())) {
      this.backupCodes.set([]);
      this.qrCode.set(null);
      this.model.set({ code: '', backupCode: '', password: '' });
    }
  }

  async regenerateBackupCodes(): Promise<void> {
    const response = await this.auth.regenerateBackupCodes(this.managementPayload());
    this.backupCodes.set(response?.backupCodes ?? []);
  }

  private managementPayload() {
    return {
      password: this.model().password,
      code: this.model().code || undefined,
      backupCode: this.model().backupCode || undefined,
    };
  }
}
