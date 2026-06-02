export const environment = {
  name: 'dev',
  production: false,
  apiBaseUrl: 'https://dev-api.example.com',
  auth: {
    tokenStorageKey: 'car-showroom.dev.access-token',
    refreshTokenStorageKey: 'car-showroom.dev.refresh-token',
    tenantStorageKey: 'car-showroom.dev.tenant-id',
    unauthorizedRedirect: '/client/sign-in',
  },
  logging: {
    http: true,
    router: true,
  },
  tours: {
    enabled: true,
    storageKey: 'car-showroom.dev.tours',
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
