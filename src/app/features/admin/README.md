# Admin

Admin module shell for showroom operations. The initial route is protected by `authGuard` and prepared for inventory, lead, and listing workflows.

## Vehicle Definitions

Routes under `/admin/vehicles` provide admin inventory listing management:

- `/admin/vehicles` - overview, counters, filters, and edit actions.
- `/admin/vehicles/create` - create a draft or published listing.
- `/admin/vehicles/edit/:id` - edit persisted vehicle details and images.

See `vehicles/README.md` for API endpoints and extension notes.

## RBAC Administration

Routes under `/admin/rbac` provide tenant access management for authorized administrators:

- `/admin/rbac/users` - active users, pending invitations, disabled users, role assignment, disable/enable, and reset initiation.
- `/admin/rbac/invitations` - invitation lifecycle management.
- `/admin/rbac/roles` and `/admin/rbac/roles/:id` - role CRUD, protected system-role behavior, assigned users, and permission assignment.
- `/admin/rbac/permissions` - grouped permissions and role-permission matrix controls.
- `/admin/rbac/audit` - paginated sanitized RBAC activity.

These routes are guarded by current auth roles and permissions. Server mutations still enforce tenant context, CSRF, and admin authorization under `/api/admin/rbac/**`.
