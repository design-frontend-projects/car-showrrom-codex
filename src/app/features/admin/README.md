# Admin

Admin module shell for showroom operations. The initial route is protected by `authGuard` and prepared for inventory, lead, and listing workflows.

## Vehicle Definitions

Routes under `/admin/vehicles` provide admin inventory listing management:

- `/admin/vehicles` - overview, counters, filters, and edit actions.
- `/admin/vehicles/create` - create a draft or published listing.
- `/admin/vehicles/edit/:id` - edit persisted vehicle details and images.

See `vehicles/README.md` for API endpoints and extension notes.
