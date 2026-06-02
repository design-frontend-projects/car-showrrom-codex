import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { email, minLength, pattern, required, schema } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthFacade } from '../../core/auth/auth.facade';
import { createSignalForm } from '../../utils/signal-form.util';

interface LoginModel {
  email: string;
  password: string;
  remember: boolean;
}

interface TwoFactorModel {
  code: string;
  backupCode: string;
}

interface ResetModel {
  email: string;
  otp: string;
  password: string;
}

const loginSchema = schema<LoginModel>((path) => {
  required(path.email, { message: 'auth.validation.email.required' });
  email(path.email, { message: 'auth.validation.email.email' });
  required(path.password, { message: 'auth.validation.password.required' });
});

const twoFactorSchema = schema<TwoFactorModel>((path) => {
  pattern(path.code, /^[0-9]{6,8}$/, { message: 'auth.validation.otp.format' });
});

const resetSchema = schema<ResetModel>((path) => {
  required(path.email, { message: 'auth.validation.email.required' });
  email(path.email, { message: 'auth.validation.email.email' });
  pattern(path.otp, /^[0-9]{4,10}$/, { message: 'auth.validation.otp.format' });
  minLength(path.password, 12, { message: 'auth.validation.password.minLength' });
});

@Component({
  selector: 'app-sign-in-page',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <section class="auth-page">
      <div class="page-header">
        <span class="eyebrow">{{ 'auth.signIn' | translate }}</span>
        <h1>{{ pageTitle() | translate }}</h1>
        <p>{{ pageCopy() | translate }}</p>
      </div>

      @if (auth.error(); as error) {
        <p class="form-error">{{ error | translate }}</p>
      }

      @if (step() === 'login') {
        <form class="contact-form" (ngSubmit)="submitLogin()">
          <input
            pInputText
            name="email"
            type="email"
            [ngModel]="loginModel().email"
            (ngModelChange)="updateLogin('email', $event)"
            [placeholder]="'auth.email' | translate"
            autocomplete="email"
          />
          <input
            pInputText
            name="password"
            type="password"
            [ngModel]="loginModel().password"
            (ngModelChange)="updateLogin('password', $event)"
            [placeholder]="'auth.password' | translate"
            autocomplete="current-password"
          />
          <label class="inline-control">
            <input
              type="checkbox"
              [ngModel]="loginModel().remember"
              (ngModelChange)="updateLogin('remember', $event)"
              name="remember"
            />
            <span>{{ 'auth.rememberMe' | translate }}</span>
          </label>
          <p-button type="submit" [label]="'auth.signIn' | translate" icon="pi pi-sign-in" [disabled]="!canLogin()" />
          <button class="link-button" type="button" (click)="startReset()">{{ 'auth.reset.start' | translate }}</button>
        </form>
      }

      @if (step() === '2fa') {
        <form class="contact-form" (ngSubmit)="submitTwoFactor()">
          @if (auth.challenge()?.setupRequired) {
            <p>{{ 'auth.twoFactor.requiredSetup' | translate }}</p>
            <p-button type="button" [label]="'auth.twoFactor.startSetup' | translate" icon="pi pi-qrcode" (onClick)="startChallengeSetup()" />
          }
          @if (setupQrCode()) {
            <img class="qr-code" [src]="setupQrCode()" [alt]="'auth.twoFactor.qrAlt' | translate" />
          }
          <input
            pInputText
            name="code"
            inputmode="numeric"
            [ngModel]="twoFactorModel().code"
            (ngModelChange)="updateTwoFactor('code', $event)"
            [placeholder]="'auth.twoFactor.code' | translate"
            autocomplete="one-time-code"
          />
          <input
            pInputText
            name="backupCode"
            [ngModel]="twoFactorModel().backupCode"
            (ngModelChange)="updateTwoFactor('backupCode', $event)"
            [placeholder]="'auth.twoFactor.backupCode' | translate"
            autocomplete="one-time-code"
          />
          <p-button type="submit" [label]="'auth.twoFactor.verify' | translate" icon="pi pi-shield" [disabled]="!canVerifyTwoFactor()" />
        </form>
      }

      @if (step() === 'reset-request') {
        <form class="contact-form" (ngSubmit)="submitResetRequest()">
          <input
            pInputText
            name="resetEmail"
            type="email"
            [ngModel]="resetModel().email"
            (ngModelChange)="updateReset('email', $event)"
            [placeholder]="'auth.email' | translate"
            autocomplete="email"
          />
          <p-button type="submit" [label]="'auth.reset.request' | translate" icon="pi pi-send" [disabled]="!canRequestReset()" />
          <button class="link-button" type="button" (click)="step.set('login')">{{ 'auth.backToSignIn' | translate }}</button>
        </form>
      }

      @if (step() === 'reset-verify') {
        <form class="contact-form" (ngSubmit)="submitResetVerify()">
          @if (demoOtp()) {
            <p class="demo-otp">{{ 'auth.reset.demoOtp' | translate: { code: demoOtp() } }}</p>
          }
          <input
            pInputText
            name="otp"
            inputmode="numeric"
            [ngModel]="resetModel().otp"
            (ngModelChange)="updateReset('otp', $event)"
            [placeholder]="'auth.reset.otp' | translate"
            autocomplete="one-time-code"
          />
          <p-button type="submit" [label]="'auth.reset.verify' | translate" icon="pi pi-check" [disabled]="!canVerifyReset()" />
        </form>
      }

      @if (step() === 'reset-complete') {
        <form class="contact-form" (ngSubmit)="submitResetComplete()">
          <input
            pInputText
            name="newPassword"
            type="password"
            [ngModel]="resetModel().password"
            (ngModelChange)="updateReset('password', $event)"
            [placeholder]="'auth.reset.newPassword' | translate"
            autocomplete="new-password"
          />
          <p-button type="submit" [label]="'auth.reset.complete' | translate" icon="pi pi-key" [disabled]="!canCompleteReset()" />
        </form>
      }
    </section>
  `,
  styles: [
    `
      .inline-control {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--muted-strong);
        font-weight: 800;
      }

      .form-error,
      .demo-otp {
        color: var(--accent);
        font-weight: 800;
      }

      .link-button {
        border: 0;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        font-weight: 850;
        text-decoration: underline;
      }

      .qr-code {
        width: min(14rem, 72vw);
        aspect-ratio: 1;
        object-fit: contain;
      }
    `
  ]
})
export class SignInPage {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  readonly step = signal<'login' | '2fa' | 'reset-request' | 'reset-verify' | 'reset-complete'>('login');
  readonly setupQrCode = signal<string | null>(null);
  readonly demoOtp = signal<string | null>(null);
  readonly resetToken = signal<string | null>(null);

  readonly loginForm = createSignalForm<LoginModel>({ email: '', password: '', remember: false }, loginSchema);
  readonly loginModel = this.loginForm.model;
  readonly twoFactorForm = createSignalForm<TwoFactorModel>({ code: '', backupCode: '' }, twoFactorSchema);
  readonly twoFactorModel = this.twoFactorForm.model;
  readonly resetForm = createSignalForm<ResetModel>({ email: '', otp: '', password: '' }, resetSchema);
  readonly resetModel = this.resetForm.model;

  readonly pageTitle = computed(() => {
    if (this.step() === '2fa') {
      return 'auth.twoFactor.title';
    }

    if (this.step().startsWith('reset')) {
      return 'auth.reset.title';
    }

    return 'auth.signInTitle';
  });
  readonly pageCopy = computed(() => {
    if (this.step() === '2fa') {
      return 'auth.twoFactor.copy';
    }

    if (this.step().startsWith('reset')) {
      return 'auth.reset.copy';
    }

    return 'auth.signInCopy';
  });

  readonly canLogin = computed(() => this.loginModel().email.includes('@') && this.loginModel().password.length > 0);
  readonly canVerifyTwoFactor = computed(() => this.twoFactorModel().code.length >= 6 || this.twoFactorModel().backupCode.length >= 8);
  readonly canRequestReset = computed(() => this.resetModel().email.includes('@'));
  readonly canVerifyReset = computed(() => /^[0-9]{4,10}$/.test(this.resetModel().otp));
  readonly canCompleteReset = computed(() => this.resetModel().password.length >= 12 && this.resetToken() !== null);

  updateLogin(field: keyof LoginModel, value: string | boolean): void {
    this.loginModel.update((current) => ({ ...current, [field]: value }));
  }

  updateTwoFactor(field: keyof TwoFactorModel, value: string): void {
    this.twoFactorModel.update((current) => ({ ...current, [field]: value }));
  }

  updateReset(field: keyof ResetModel, value: string): void {
    this.resetModel.update((current) => ({ ...current, [field]: value }));
  }

  async submitLogin(): Promise<void> {
    if (!this.canLogin()) {
      return;
    }

    await this.auth.login(this.loginModel());

    if (this.auth.requiresTwoFactor()) {
      this.step.set('2fa');
      return;
    }

    if (this.auth.isAuthenticated()) {
      await this.router.navigateByUrl('/client');
    }
  }

  startReset(): void {
    this.resetModel.update((current) => ({ ...current, email: this.loginModel().email }));
    this.step.set('reset-request');
  }

  async submitResetRequest(): Promise<void> {
    const response = await this.auth.resetRequest({ email: this.resetModel().email });
    this.demoOtp.set(response.demoOtp ?? null);
    this.step.set('reset-verify');
  }

  async submitResetVerify(): Promise<void> {
    const response = await this.auth.resetVerify({
      email: this.resetModel().email,
      otp: this.resetModel().otp,
    });
    this.resetToken.set(response.resetToken);
    this.step.set('reset-complete');
  }

  async submitResetComplete(): Promise<void> {
    const token = this.resetToken();

    if (!token) {
      return;
    }

    await this.auth.resetComplete({ resetToken: token, password: this.resetModel().password });
    this.step.set('login');
  }

  async startChallengeSetup(): Promise<void> {
    const challengeToken = this.auth.challenge()?.challengeToken;

    if (!challengeToken) {
      return;
    }

    const setup = await this.auth.startTwoFactorSetup({ challengeToken });
    this.setupQrCode.set(setup?.qrCodeDataUrl ?? null);
  }

  async submitTwoFactor(): Promise<void> {
    const response = await this.auth.verifyTwoFactor({
      challengeToken: this.auth.challenge()?.challengeToken,
      code: this.twoFactorModel().code || undefined,
      backupCode: this.twoFactorModel().backupCode || undefined,
    });

    if (response && 'status' in response && response.status === 'authenticated') {
      await this.router.navigateByUrl('/client');
    }
  }
}
