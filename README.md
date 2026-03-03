# SQL-First Multi-Tenant Task Backend (PostgreSQL)

## 1. Overview

A multi-tenant task and document management backend (“Notion-lite backend”) built with PostgreSQL.
Features:

- Multiple organizations (tenants), strictly isolated
- Users belong to a single tenant
- Projects contain tasks or documents (items)
- API-only, no frontend
- Designed for **strict tenant isolation, ACID correctness, and predictable performance.**

## 2. Core Concepts

- **Tenant**: organization owning users and projects
- **User**: belongs to exactly one tenant; has a role (admin/member)
- **Project**: belongs to a tenant; contains items
- **Item**: task or document; belongs to a project
- **Role / Status**: controlled via ENUMs or CHECK constraints

## 3. Database Schema

### 3.1 Tables

**tenants**

- id (PK), name (UNIQUE), created_at

**users**

- id (PK), tenant_id (FK → tenants.id), email (UNIQUE per tenant), role (ENUM), password_hash, created_at

**projects**

- id (PK), tenant_id (FK), name, created_at

**items**

- id (PK), project_id (FK), title, status (ENUM), created_at

### 3.2 Constraints

- UNIQUE(tenant_id, email)
- FOREIGN KEYs with ON DELETE CASCADE
- NOT NULL where applicable
- ENUMs / CHECK constraints for role/status

## 4. Tenant Isolation Strategy

- All tenant-scoped tables include tenant_id
- Query example (safe, no cross-tenant leakage):
    - SELECT * FROM projects
    - WHERE tenant_id = $1
    - AND id = $2;
- Users unique per tenant; global uniqueness unnecessary
- Role/status enforced via ENUMs/CHECK constraints

## 5. Transactions & Correctness

- Create Tenant + Admin User Atomically
    - BEGIN;
    - INSERT INTO tenants (...) RETURNING id;
    - INSERT INTO users (...) -- role = 'admin'
    - COMMIT;
- Bulk Insert Items: all-or-nothing; rollback on failure
- Tenant Deletion: cascades everything with transaction

## 6. Indexing & Performance

- Indexes
    - (tenant_id, id) on tenant-scoped tables
    - (tenant_id, email) for user lookup
    - (project_id, created_at DESC) for item listing

### 6.1 Query Performance Example

- Query
    - EXPLAIN ANALYZE
    - SELECT *
    - FROM users
    - WHERE tenant_id = '9ff48fed-5150-4fab-8628-df60c4b39f58'
    - AND email = 'user_1@tenant_1.com';


- Index Used: idx_users_tenant_email

  | Metric              | Value                             |
  |---------------------|-----------------------------------|
  | Index Cond          | (tenant_id = ... AND email = ...) |
  | Index Searches      | 1                                 |
  | Buffers (execution) | shared hit=1 read=3               |
  | Buffers (planning)  | shared hit=16                     |
  | Planning Time       | 0.310 ms                          |
  | Execution Time      | 0.310 ms                          |

    - Observed latency: 0.3ms
    - Using the index reduced the need for a sequential scan, demonstrating performance improvement.

### 6.2 Before vs After index

| Scenario            | Execution Time | Notes                       |
|---------------------|----------------|-----------------------------|
| Seq Scan (no index) | ~120 ms        | Full table scan             |
| Index Scan          | 0.301 ms       | Used idx_users_tenant_email |

- Shows a massive reductions in query latency after indexing

## 7. Pagination & Filtering

- Endpoints support limit, offset, sort, filter by status

Offset pagination:

- Simple, but degrades with large datasets (OFFSET 10000 LIMIT 20 scans 10k rows)

Cursor pagination:

- SELECT *
- FROM items
- WHERE project_id = $1
- AND created_at < $2
- ORDER BY created_at DESC
- LIMIT 20;

## 8. API Layer

- Minimal REST API
- Tenant derived from authenticated session (never client-supplied)
- Proper HTTP status codes (201, 400, 409)
- Meaningful error responses:

{
"error": "Invalid status value",
"code": "VALIDATION_ERROR"
}

## 9. Security

- Tenant ID enforced server-side
- Prepared statements only (no SQL injection)
- Input validation: required fields, enums, UUIDs/int IDs

## 10. Testing Strategy

- Unit Tests: tenant isolation, transaction rollback
- Integration Tests: full PostgreSQL instance, create tenant → project → items → paginated query → cascade deletion

## 11. Tradeoffs

- Shared DB Multi-Tenancy: cheaper, easier migrations, may cause resource contention
- Offset vs Cursor Pagination: offset simpler, cursor better at scale
- ENUM vs Lookup Table: ENUM simpler/faster, harder to change dynamically

## 12. Summary

- Strong data integrity, strict tenant isolation, ACID correctness
- Transactions ensure atomic operations
- Indexing ensures predictable performance
- Minimal, safe API surface