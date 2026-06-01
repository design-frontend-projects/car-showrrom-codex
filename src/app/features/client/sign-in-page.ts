import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthFacade } from '../../core/auth/auth.facade';

@Component({
  selector: 'app-sign-in-page',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <section class="auth-page">
      <div class="page-header">
        <span class="eyebrow">{{ 'auth.signIn' | translate }}</span>
        <h1>{{ 'auth.signInTitle' | translate }}</h1>
        <p>{{ 'auth.signInCopy' | translate }}</p>
      </div>

      <form class="contact-form" (ngSubmit)="submit()">
        <input pInputText name="email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" [placeholder]="'auth.email' | translate" />
        <input
          pInputText
          name="password"
          type="password"
          [ngModel]="password()"
          (ngModelChange)="password.set($event)"
          [placeholder]="'auth.password' | translate"
        />
        <p-button type="submit" [label]="'auth.signIn' | translate" icon="pi pi-sign-in" />
      </form>
    </section>
  `
})
export class SignInPage {
  private readonly auth = inject(AuthFacade);
  readonly email = signal('');
  readonly password = signal('');

  submit(): void {
    this.auth.login({ email: this.email(), password: this.password() });
  }
}
