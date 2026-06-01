# Environments

Environment files for dev, test, and prod builds. They control API base URLs, auth token keys, logging flags, tour behavior, i18n defaults, and Google Maps API settings through Angular file replacements.

Set `googleMaps.apiKey` per environment to enable the reusable map component. The default empty value intentionally renders a safe placeholder so SSR and local builds work without a private key.
