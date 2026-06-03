export const environment = {
  name: 'test',
  production: false,
  apiBaseUrl: '/api',
  auth: {
    csrfCookieName: 'cs_csrf',
    tenantStorageKey: 'car-showroom.test.tenant-id',
    stateStorage: 'sessionStorage',
    stateStorageKey: 'car-showroom.test.auth-state',
    unauthorizedRedirect: '/client/sign-in',
  },
  logging: {
    http: true,
    router: false,
  },
  tours: {
    enabled: false,
    storageKey: 'car-showroom.test.tours',
  },
  i18n: {
    defaultLang: 'en',
    fallbackLang: 'en',
  },
  googleMaps: {
    apiKey: 'AIzaSyC0IHdnPJ42sJWE-8qRQ6XXa18Zj6-J92A',
    mapId: '',
    language: 'en',
    region: 'AE',
    libraries: ['maps', 'marker', 'places', 'routes', 'geocoding'] as const,
  },
} as const;
