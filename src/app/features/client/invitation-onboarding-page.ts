import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { minLength, pattern, required, schema } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthFacade } from '../../core/auth/auth.facade';
import { createSignalForm } from '../../utils/signal-form.util';

interface OnboardingModel {
  displayName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/;
const phonePolicy = /^$|^\+?[0-9 ()-]{7,32}$/;

const onboardingSchema = schema<OnboardingModel>((path) => {
  required(path.displayName, { message: 'auth.validation.displayName.required' });
  pattern(path.phone, phonePolicy, { message: 'auth.validation.phone.format' });
  minLength(path.password, 8, { message: 'auth.validation.password.minLength' });
  pattern(path.password, passwordPolicy, { message: 'auth.validation.password.policy' });
  required(path.confirmPassword, { message: 'auth.validation.password.required' });
});

@Component({
  selector: 'app-invitation-onboarding-page',
  imports: [ButtonModule, FormsModule, InputTextModule, LucideAngularModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-page onboarding-page">
      <div class="page-header">
        <span class="eyebrow">{{ 'auth.onboarding.kicker' | translate }}</span>
        <h1>{{ 'auth.onboarding.title' | translate }}</h1>
        <p>{{ 'auth.onboarding.copy' | translate }}</p>
      </div>

      @if (auth.status() === 'pending') {
        <div class="state-panel">{{ 'auth.onboarding.loading' | translate }}</div>
      } @else if (safeError()) {
        <div class="state-panel error">
          <p>{{ safeError() | translate }}</p>
          <a routerLink="/client/sign-in" class="text-link">{{ 'auth.backToSignIn' | translate }}</a>
        </div>
      } @else if (auth.onboarding(); as onboarding) {
        <form class="contact-form onboarding-form" (ngSubmit)="submit()">
          <label>
            {{ 'auth.email' | translate }}
            <input pInputText name="email" type="email" [value]="onboarding.invitation.email" readonly />
          </label>
          <label>
            {{ 'auth.displayName' | translate }}
            <input
              pInputText
              name="displayName"
              [ngModel]="model().displayName"
              (ngModelChange)="update('displayName', $event)"
              autocomplete="name"
              required
            />
          </label>
          @if (model().displayName.trim().length > 0 && model().displayName.trim().length < 2) {
            <p class="field-error">{{ 'auth.validation.displayName.required' | translate }}</p>
          }
          <label>
            {{ 'auth.phone' | translate }}
            <input
              pInputText
              name="phone"
              [ngModel]="model().phone"
              (ngModelChange)="update('phone', $event)"
              autocomplete="tel"
            />
          </label>
          @if (model().phone && !validPhone()) {
            <p class="field-error">{{ 'auth.validation.phone.format' | translate }}</p>
          }
          <label>
            {{ 'auth.password' | translate }}
            <input
              pInputText
              name="password"
              type="password"
              [ngModel]="model().password"
              (ngModelChange)="update('password', $event)"
              autocomplete="new-password"
              required
            />
          </label>
          @if (model().password && !validPassword()) {
            <p class="field-error">{{ 'auth.validation.password.policy' | translate }}</p>
          }
          <label>
            {{ 'auth.onboarding.confirmPassword' | translate }}
            <input
              pInputText
              name="confirmPassword"
              type="password"
              [ngModel]="model().confirmPassword"
              (ngModelChange)="update('confirmPassword', $event)"
              autocomplete="new-password"
              required
            />
          </label>
          @if (model().confirmPassword && !passwordsMatch()) {
            <p class="field-error">{{ 'auth.validation.password.confirm' | translate }}</p>
          }
          @if (auth.error(); as error) {
            <p class="form-error">{{ error | translate }}</p>
          }
          <div class="button-row">
            <p-button type="submit" [label]="'auth.onboarding.submit' | translate" [disabled]="!canSubmit()">
              <lucide-icon name="key-round" size="18" />
            </p-button>
            <p-button type="button" [label]="'auth.onboarding.cancel' | translate" [outlined]="true" (onClick)="cancel()" />
          </div>
        </form>
      }
    </section>
  `,
  styles: [
    `
      .onboarding-form label {
        display: grid;
        gap: 0.45rem;
        font-weight: 850;
      }

      .field-error,
      .form-error {
        margin: -0.35rem 0 0;
        color: var(--accent);
        font-weight: 800;
      }
    `,
  ],
})
export class InvitationOnboardingPage implements OnInit, OnDestroy {
  readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(null);
  private readonly challengeToken = signal<string | null>(null);
  private readonly completed = signal(false);
  readonly safeError = signal<string | null>(null);
  readonly onboardingForm = createSignalForm<OnboardingModel>(
    { displayName: '', phone: '', password: '', confirmPassword: '' },
    onboardingSchema,
  );
  readonly model = this.onboardingForm.model;
  readonly validPhone = computed(() => phonePolicy.test(this.model().phone.trim()));
  readonly validPassword = computed(() => this.model().password.length >= 8 && passwordPolicy.test(this.model().password));
  readonly passwordsMatch = computed(() => this.model().password === this.model().confirmPassword);
  readonly canSubmit = computed(
    () =>
      Boolean(this.token() || this.challengeToken()) &&
      this.model().displayName.trim().length >= 2 &&
      this.validPhone() &&
      this.validPassword() &&
      this.passwordsMatch() &&
      this.auth.status() !== 'pending',
  );

  async ngOnInit(): Promise<void> {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
    this.challengeToken.set(this.route.snapshot.queryParamMap.get('challenge'));

    const request: { token?: string; challengeToken?: string } = this.token()
      ? { token: this.token() ?? undefined }
      : { challengeToken: this.challengeToken() ?? undefined };

    if (!request.token && !request.challengeToken) {
      this.safeError.set('auth.error.invitationInvalid');
      return;
    }

    const onboarding = await this.auth.lookupInvitationOnboarding(request);

    if (!onboarding) {
      this.safeError.set(this.auth.error() ?? 'auth.error.invitationInvalid');
      return;
    }

    this.challengeToken.set(onboarding.challengeToken);
    this.model.update((current) => ({
      ...current,
      displayName: onboarding.invitation.displayName ?? '',
    }));
  }

  ngOnDestroy(): void {
    if (!this.completed()) {
      this.auth.clearOnboarding();
    }
  }

  update(field: keyof OnboardingModel, value: string): void {
    this.model.update((current) => ({ ...current, [field]: value }));
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    const accepted = await this.auth.acceptInvitationOnboarding({
      token: this.token() ?? undefined,
      challengeToken: this.token() ? undefined : this.challengeToken() ?? undefined,
      displayName: this.model().displayName.trim(),
      phone: this.model().phone.trim() || null,
      password: this.model().password,
    });

    if (accepted) {
      this.completed.set(true);
      await this.router.navigate(['/client/sign-in'], { queryParams: { onboarding: 'success' } });
    }
  }

  async cancel(): Promise<void> {
    this.auth.clearOnboarding();
    await this.router.navigateByUrl('/client/sign-in');
  }
}
