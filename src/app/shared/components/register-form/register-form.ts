import { Component, computed, output } from '@angular/core';
import { email, minLength, pattern, required, schema } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RegisterRequest } from '../../../core/auth/auth.models';
import { createSignalForm } from '../../../utils/signal-form.util';

interface RegisterFormModel {
  displayName: string;
  email: string;
  phone: string;
  password: string;
}

const registerSchema = schema<RegisterFormModel>((path) => {
  required(path.displayName, { message: 'auth.validation.displayName.required' });
  required(path.email, { message: 'auth.validation.email.required' });
  email(path.email, { message: 'auth.validation.email.email' });
  required(path.password, { message: 'auth.validation.password.required' });
  minLength(path.password, 8, { message: 'auth.validation.password.minLength' });
  pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'auth.validation.password.policy'
  });
});

@Component({
  selector: 'app-register-form',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <form class="register-form" (ngSubmit)="submitForm()">
      <div class="field">
        <label for="displayName">{{ 'auth.displayName' | translate }}</label>
        <input
          id="displayName"
          pInputText
          name="displayName"
          [ngModel]="model().displayName"
          (ngModelChange)="update('displayName', $event)"
          autocomplete="name"
          placeholder="e.g. Alex Morgan"
        />
      </div>

      <div class="field">
        <label for="reg-email">{{ 'auth.email' | translate }}</label>
        <input
          id="reg-email"
          pInputText
          name="email"
          type="email"
          [ngModel]="model().email"
          (ngModelChange)="update('email', $event)"
          autocomplete="email"
          placeholder="name@example.com"
        />
      </div>

      <div class="field">
        <label for="phone">{{ 'auth.phone' | translate }}</label>
        <input
          id="phone"
          pInputText
          name="phone"
          [ngModel]="model().phone"
          (ngModelChange)="update('phone', $event)"
          autocomplete="tel"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div class="field">
        <label for="reg-password">{{ 'auth.password' | translate }}</label>
        <input
          id="reg-password"
          pInputText
          name="password"
          type="password"
          [ngModel]="model().password"
          (ngModelChange)="update('password', $event)"
          autocomplete="new-password"
          placeholder="••••••••"
        />
        <small class="hint">Min 8 chars, mixed case, number & symbol</small>
      </div>

      <p-button type="submit" styleClass="w-full" [label]="'auth.register' | translate" [disabled]="!canSubmit()" />
    </form>
  `,
  styles: [`
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--nt-text-secondary);
    }
    .field .hint {
      font-size: 0.75rem;
      color: var(--nt-text-tertiary);
    }
  `]
})
export class RegisterForm {
  readonly submitted = output<RegisterRequest>();
  readonly form = createSignalForm<RegisterFormModel>(
    {
      displayName: '',
      email: '',
      phone: '',
      password: ''
    },
    registerSchema
  );
  readonly model = this.form.model;
  readonly canSubmit = computed(() => {
    const value = this.model();

    return (
      value.displayName.trim().length >= 2 &&
      value.email.includes('@') &&
      value.password.length >= 8 &&
      /[a-z]/.test(value.password) &&
      /[A-Z]/.test(value.password) &&
      /\d/.test(value.password) &&
      /[^A-Za-z0-9]/.test(value.password)
    );
  });

  update(field: keyof RegisterFormModel, value: string): void {
    this.model.update((current) => ({ ...current, [field]: value }));
  }

  submitForm(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.submitted.emit(this.model());
  }
}
