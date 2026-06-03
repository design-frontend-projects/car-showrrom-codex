import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { CardModule } from 'primeng/card';
import { DEFINITION_CONFIGS } from './admin-definition.util';

@Component({
  selector: 'app-admin-definitions-page',
  imports: [CardModule, LucideAngularModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'admin.definitions.kicker' | translate }}</span>
      <h1>{{ 'admin.definitions.title' | translate }}</h1>
      <p>{{ 'admin.definitions.copy' | translate }}</p>
    </section>

    <section class="definition-grid" aria-label="Vehicle definition sections">
      @for (config of configs; track config.entity) {
        <a [routerLink]="['/admin/definitions', config.entity]" class="definition-card">
          <p-card>
            <div class="definition-card-content">
              <lucide-icon [name]="config.icon" size="22" />
              <div>
                <strong>{{ config.titleKey | translate }}</strong>
                <span>{{ config.descriptionKey | translate }}</span>
              </div>
            </div>
          </p-card>
        </a>
      }
      <a routerLink="/admin/users-roles" class="definition-card">
        <p-card>
          <div class="definition-card-content">
            <lucide-icon name="users" size="22" />
            <div>
              <strong>{{ 'admin.usersRoles.title' | translate }}</strong>
              <span>{{ 'admin.usersRoles.copy' | translate }}</span>
            </div>
          </div>
        </p-card>
      </a>
    </section>
  `,
  styles: [
    `
      .definition-grid {
        width: min(100%, var(--content-max));
        margin: 0 auto var(--space-8);
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      }

      .definition-card {
        color: inherit;
        text-decoration: none;
      }

      .definition-card-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .definition-card-content div {
        display: grid;
        gap: var(--space-1);
      }

      .definition-card-content span {
        color: var(--muted);
      }
    `,
  ],
})
export class AdminDefinitionsPage {
  readonly configs = DEFINITION_CONFIGS;
}
