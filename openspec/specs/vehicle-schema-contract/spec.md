# vehicle-schema-contract Specification

## Purpose
Define the developer-facing schema mapping and compatibility checks that keep vehicle definition, user, and role contracts aligned with the Prisma schema.
## Requirements
### Requirement: Vehicle schema mapping document
The system SHALL provide a developer-facing mapping document that lists each frontend vehicle-definition, user, and role data contract against the exact Prisma model, database table, field name, mapped column name, scalar type, required/optional status, and relationship used by the application.

#### Scenario: Mapping includes vehicle definition models
- **WHEN** a developer opens the schema mapping document
- **THEN** it lists make, model, trim, transmission, engine, fuel type, body type, and condition contracts with exact Prisma model and database table names

#### Scenario: Mapping includes users and roles
- **WHEN** a developer opens the schema mapping document
- **THEN** it lists `User`, `Role`, and `UserRole` contracts with exact fields required for role-aware session hydration and admin users-and-roles display

#### Scenario: Mapping records schema gaps
- **WHEN** a requested frontend contract is not backed by a canonical Prisma model or database table
- **THEN** the document marks the gap as incompatible and names the migration or implementation decision required before UI work can be accepted

### Requirement: Required vehicle catalog field checklist
The schema mapping document SHALL include a checklist for required fields, optional metadata fields, and foreign-key relationships for each vehicle definition entity.

#### Scenario: Make checklist is inspected
- **WHEN** the make mapping is inspected
- **THEN** it identifies tenant ID, display name, normalized name, active status, timestamps, uniqueness constraints, and model relationship expectations

#### Scenario: Model checklist is inspected
- **WHEN** the model mapping is inspected
- **THEN** it identifies tenant ID, make relationship, display name, normalized name, production year range metadata, active status, timestamps, and uniqueness constraints

#### Scenario: Trim checklist is inspected
- **WHEN** the trim mapping is inspected
- **THEN** it identifies tenant ID, model relationship, display name, normalized name, body type, fuel type, transmission, engine relationship, active status, timestamps, and uniqueness constraints

### Requirement: Schema compatibility check
The system SHALL provide a repeatable dev-time compatibility check that compares frontend schema expectations to `prisma/schema.prisma`.

#### Scenario: Compatible schema passes
- **WHEN** a developer runs the documented schema compatibility command against a compatible Prisma schema
- **THEN** the command exits successfully and reports that all expected models, fields, field types, and relationships are present

#### Scenario: Missing model fails
- **WHEN** a required canonical table such as engine definitions is missing from `prisma/schema.prisma`
- **THEN** the command fails with an error that names the missing model, the affected frontend contract, and the remediation path

#### Scenario: Field type mismatch fails
- **WHEN** a Prisma field exists but its type or optionality does not match the frontend mapping
- **THEN** the command fails with an error that names the model, field, expected type, actual type, and required remediation

### Requirement: Schema migration checklist
The system SHALL document the steps required when schema changes affect vehicle definition or RBAC contracts.

#### Scenario: Vehicle definition schema changes
- **WHEN** a developer changes a vehicle definition model, field, enum, or relationship
- **THEN** the checklist instructs them to update the mapping document, run Prisma validation/generation, update DTOs, update translations when labels change, and run affected tests

#### Scenario: RBAC schema changes
- **WHEN** a developer changes user, role, or user-role fields used by session hydration
- **THEN** the checklist instructs them to update sanitized DTOs, storage serialization, NgRx store state, API contracts, and guard tests
