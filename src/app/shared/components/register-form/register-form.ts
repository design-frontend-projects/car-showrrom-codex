import { Component, computed, output } from '@angular/core';
import { email, required, schema } from '@angular/forms/signals';
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
  required(path.displayName, { message: 'Display name is required.' });
  required(path.email, { message: 'Email is required.' });
  email(path.email, { message: 'Enter a valid email address.' });
  required(path.password, { message: 'Password is required.' });
});

@Component({
  selector: 'app-register-form',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <form class="grid gap-3" (ngSubmit)="submitForm()">
      <label class="grid gap-1 text-sm">
        <span>{{ 'auth.displayName' | translate }}</span>
        <input
          pInputText
          name="displayName"
          [ngModel]="model().displayName"
          (ngModelChange)="update('displayName', $event)"
          autocomplete="name"
        />
      </label>

      <label class="grid gap-1 text-sm">
        <span>{{ 'auth.email' | translate }}</span>
        <input
          pInputText
          name="email"
          type="email"
          [ngModel]="model().email"
          (ngModelChange)="update('email', $event)"
          autocomplete="email"
        />
      </label>

      <label class="grid gap-1 text-sm">
        <span>{{ 'auth.phone' | translate }}</span>
        <input pInputText name="phone" [ngModel]="model().phone" (ngModelChange)="update('phone', $event)" autocomplete="tel" />
      </label>

      <label class="grid gap-1 text-sm">
        <span>{{ 'auth.password' | translate }}</span>
        <input
          pInputText
          name="password"
          type="password"
          [ngModel]="model().password"
          (ngModelChange)="update('password', $event)"
          autocomplete="new-password"
        />
      </label>

      <p-button type="submit" styleClass="w-full" [label]="'auth.register' | translate" [disabled]="!canSubmit()" />
    </form>
  `
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
  readonly canSubmit = computed(() => this.model().displayName.trim() !== '' && this.model().email.includes('@') && this.model().password.length >= 6);

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
