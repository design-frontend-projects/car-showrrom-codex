export const environment = {
  name: 'test',
  production: false,
  apiBaseUrl: 'https://test-api.example.com',
  auth: {
    tokenStorageKey: 'car-showroom.test.access-token',
    refreshTokenStorageKey: 'car-showroom.test.refresh-token',
    unauthorizedRedirect: '/client/sign-in'
  },
  logging: {
    http: true,
    router: false
  },
  tours: {
    enabled: false,
    storageKey: 'car-showroom.test.tours'
  },
  i18n: {
    defaultLang: 'en',
    fallbackLang: 'en'
  },
  googleMaps: {
    apiKey: '',
    mapId: '',
    language: 'en',
    region: 'AE',
    libraries: ['maps', 'marker', 'places', 'routes', 'geocoding'] as const
  }
} as const;
