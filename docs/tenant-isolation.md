# Tenant isolation

Tenant isolation prevents scans, reports and recurring comparisons for one company from being visible to or mixed with another company.

## Current implementation

The prototype uses a required HTTP header:

```http
x-tenant-id: company-x
```

All scan operations are scoped by this tenant ID:

- `GET /scans`
- `GET /scans/:scanId`
- `GET /scans/:scanId/report`
- `POST /scans/upload`

The API normalizes tenant IDs to lowercase and validates them with this rule:

```text
1-80 characters: letters, numbers, dots, underscores, colons or hyphens
```

Examples:

- `company-x`
- `company_y`
- `tenant.eu:acme`

## What is isolated

### Scan history

`GET /scans` only returns scans for the supplied `x-tenant-id`.

### Report reads

`GET /scans/:scanId/report` returns 404 if the scan exists but belongs to a different tenant.

This avoids leaking whether another tenant's scan exists.

### Recurring comparisons

The previous scan lookup is scoped by:

```text
tenantId + datasetName
```

So if Company X and Company Y both scan a dataset called `player_activity`, their comparison baselines remain separate.

## Current prototype storage

The prototype still stores reports in memory, but every `ScanReport` and `ScanListItem` now includes `tenantId` and service methods require tenant context.

This creates the same boundary the database layer should enforce later.

## Production model

In production, tenant context should come from authentication, not a user-editable header.

Recommended approach:

1. Authenticate the user.
2. Resolve allowed tenant IDs from the auth/session layer.
3. Store `tenant_id` on every tenant-owned table.
4. Require every repository query to include `tenant_id`.
5. Use database constraints and indexes to enforce tenant-aware access patterns.

## Database rules

Every tenant-owned table should include `tenant_id` directly or be reachable through a parent with `tenant_id`.

Recommended direct `tenant_id` fields:

- `datasets.tenant_id`
- `scans.tenant_id`
- `audit_events.tenant_id`

Recommended composite uniqueness:

```sql
unique (tenant_id, name) -- datasets
```

Recommended lookup indexes:

```sql
create index datasets_tenant_name_idx on datasets(tenant_id, name);
create index scans_tenant_dataset_created_at_idx on scans(tenant_id, dataset_id, created_at desc);
create index scans_tenant_status_idx on scans(tenant_id, status);
```

## Testing coverage

Backend tests verify that:

- tenant A and tenant B scan histories are separate
- tenant B cannot read tenant A's report by scan ID
- recurring comparison only considers previous scans from the same tenant
- controller calls fail when `x-tenant-id` is missing
