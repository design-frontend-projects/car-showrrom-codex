export const environment = {
  name: 'prod',
  production: true,
  apiBaseUrl: '/api',
  auth: {
    csrfCookieName: 'cs_csrf',
    tenantStorageKey: 'car-showroom.tenant-id',
    stateStorage: 'sessionStorage',
    stateStorageKey: 'car-showroom.auth-state',
    unauthorizedRedirect: '/client/sign-in',
  },
  logging: {
    http: false,
    router: false,
  },
  tours: {
    enabled: true,
    storageKey: 'car-showroom.tours',
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
