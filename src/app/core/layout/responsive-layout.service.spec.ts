import { createResponsiveLayoutSnapshot, RESPONSIVE_LAYOUT_FALLBACK, RESPONSIVE_QUERIES } from './responsive-layout.service';

describe('createResponsiveLayoutSnapshot', () => {
  it('uses a mobile fallback when no breakpoint matches', () => {
    expect(createResponsiveLayoutSnapshot({})).toEqual(RESPONSIVE_LAYOUT_FALLBACK);
  });

  it('maps mobile breakpoint matches', () => {
    expect(
      createResponsiveLayoutSnapshot({
        [RESPONSIVE_QUERIES.mobile]: true,
        [RESPONSIVE_QUERIES.handset]: true
      })
    ).toEqual({
      mode: 'mobile',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isHandset: true
    });
  });

  it('maps tablet breakpoint matches', () => {
    expect(
      createResponsiveLayoutSnapshot({
        [RESPONSIVE_QUERIES.tablet]: true,
        [RESPONSIVE_QUERIES.handset]: true
      })
    ).toEqual({
      mode: 'tablet',
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isHandset: true
    });
  });

  it('maps desktop breakpoint matches', () => {
    expect(
      createResponsiveLayoutSnapshot({
        [RESPONSIVE_QUERIES.desktop]: true,
        [RESPONSIVE_QUERIES.handset]: false
      })
    ).toEqual({
      mode: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isHandset: false
    });
  });
});
