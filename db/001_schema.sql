BEGIN;

CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE item_status AS ENUM ('todo', 'in_progress', 'done', 'archived');

CREATE TABLE tenants
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL,
    email         TEXT        NOT NULL,
    role          user_role   NOT NULL,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE,

    CONSTRAINT unique_user_email_per_tenant
        UNIQUE (tenant_id, email)
);

CREATE TABLE projects
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id  UUID        NOT NULL,
    name       TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_projects_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE,

    CONSTRAINT unique_project_name_per_tenant
        UNIQUE (tenant_id, name)
);

CREATE TABLE items
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    project_id UUID        NOT NULL,
    title      TEXT        NOT NULL,
    status     item_status NOT NULL DEFAULT 'todo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_items_project
        FOREIGN KEY (project_id)
            REFERENCES projects (id)
            ON DELETE CASCADE
);

COMMIT;
