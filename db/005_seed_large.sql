INSERT INTO tenants (id, name, created_at)
SELECT gen_random_uuid(),
       'Tenant_' || gs,
       NOW()
FROM generate_series(1, 10) gs;

INSERT INTO users (id, tenant_id, email, role, password_hash, created_at)
SELECT gen_random_uuid(),
       t.id,
       'user_' || gs || '@tenant_' || row_number() OVER () || '.com',
       CASE
           WHEN gs % 10 = 0 THEN 'admin'::user_role
           ELSE 'member'::user_role
           END,
       'hash_' || gs,
       NOW()
FROM tenants t
         CROSS JOIN generate_series(1, 10000) gs;

INSERT INTO projects (id, tenant_id, name, created_at)
SELECT gen_random_uuid(),
       t.id,
       'Project_' || gs || '_Tenant_' || t.id,
       NOW()
FROM tenants t
         CROSS JOIN generate_series(1, 10) gs;

INSERT INTO items (id, project_id, title, status, created_at)
SELECT gen_random_uuid(),
       p.id,
       'Item_' || gs,
       (CASE
            WHEN gs % 4 = 0 THEN 'todo'
            WHEN gs % 4 = 1 THEN 'in_progress'
            WHEN gs % 4 = 2 THEN 'done'
            ELSE 'archived'
           END)::item_status,
       NOW() - (gs || ' minutes') ::interval
FROM projects p
         CROSS JOIN generate_series(1, 5000) gs;