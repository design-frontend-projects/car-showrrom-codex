import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-contact-page',
  imports: [ButtonModule, FormsModule, InputTextModule, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'nav.contactUs' | translate }}</span>
      <h1>{{ 'pages.contactUs.title' | translate }}</h1>
      <p>{{ 'pages.contactUs.copy' | translate }}</p>
    </section>

    <form class="contact-form">
      <input pInputText name="name" [placeholder]="'contact.name' | translate" />
      <input pInputText name="email" type="email" [placeholder]="'contact.email' | translate" />
      <input pInputText name="message" [placeholder]="'contact.message' | translate" />
      <p-button [label]="'contact.send' | translate" icon="pi pi-send" />
    </form>
  `
})
export class ContactPage {}
