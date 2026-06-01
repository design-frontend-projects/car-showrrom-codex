import { computed, inject, Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveLayoutSnapshot {
  mode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isHandset: boolean;
}

export const RESPONSIVE_QUERIES = {
  mobile: '(max-width: 639.98px)',
  tablet: '(min-width: 640px) and (max-width: 1023.98px)',
  desktop: '(min-width: 1024px)',
  handset: '(max-width: 767.98px)'
} as const;

export const RESPONSIVE_LAYOUT_FALLBACK: ResponsiveLayoutSnapshot = {
  mode: 'mobile',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isHandset: true
};

export function createResponsiveLayoutSnapshot(matches: Record<string, boolean>): ResponsiveLayoutSnapshot {
  const isDesktop = matches[RESPONSIVE_QUERIES.desktop] ?? false;
  const isTablet = matches[RESPONSIVE_QUERIES.tablet] ?? false;
  const isMobile = matches[RESPONSIVE_QUERIES.mobile] ?? (!isDesktop && !isTablet);
  const isHandset = matches[RESPONSIVE_QUERIES.handset] ?? isMobile;
  const mode: LayoutMode = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

  return {
    mode,
    isMobile,
    isTablet,
    isDesktop,
    isHandset
  };
}

@Injectable({ providedIn: 'root' })
export class ResponsiveLayoutService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly snapshot = toSignal(
    this.breakpointObserver
      .observe(Object.values(RESPONSIVE_QUERIES))
      .pipe(map((state) => createResponsiveLayoutSnapshot(state.breakpoints))),
    { initialValue: RESPONSIVE_LAYOUT_FALLBACK }
  );

  readonly mode = computed(() => this.snapshot().mode);
  readonly isMobile = computed(() => this.snapshot().isMobile);
  readonly isTablet = computed(() => this.snapshot().isTablet);
  readonly isDesktop = computed(() => this.snapshot().isDesktop);
  readonly isHandset = computed(() => this.snapshot().isHandset);
}
