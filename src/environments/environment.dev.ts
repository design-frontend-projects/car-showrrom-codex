export const environment = {
  name: 'dev',
  production: false,
  apiBaseUrl: 'https://dev-api.example.com',
  auth: {
    tokenStorageKey: 'car-showroom.dev.access-token',
    refreshTokenStorageKey: 'car-showroom.dev.refresh-token',
    unauthorizedRedirect: '/client/sign-in'
  },
  logging: {
    http: true,
    router: true
  },
  tours: {
    enabled: true,
    storageKey: 'car-showroom.dev.tours'
  },
  i18n: {
    defaultLang: 'en',
    fallbackLang: 'en'
  }
} as const;
