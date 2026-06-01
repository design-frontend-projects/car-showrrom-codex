export const environment = {
  name: 'prod',
  production: true,
  apiBaseUrl: 'https://api.example.com',
  auth: {
    tokenStorageKey: 'car-showroom.access-token',
    refreshTokenStorageKey: 'car-showroom.refresh-token',
    unauthorizedRedirect: '/client/sign-in'
  },
  logging: {
    http: false,
    router: false
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
