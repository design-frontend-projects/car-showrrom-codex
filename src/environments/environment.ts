export const environment = {
  name: 'dev',
  production: false,
  apiBaseUrl: 'https://api.example.com',
  auth: {
    tokenStorageKey: 'car-showroom.access-token',
    refreshTokenStorageKey: 'car-showroom.refresh-token',
    unauthorizedRedirect: '/client/sign-in'
  },
  logging: {
    http: true,
    router: true
  },
  tours: {
    enabled: true,
    storageKey: 'car-showroom.tours'
  },
  i18n: {
    defaultLang: 'en',
    fallbackLang: 'en'
  }
} as const;
