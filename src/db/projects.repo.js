export async function insertProject(client, name) {
    return client.query(
        `
            INSERT INTO projects (tenant_id, name)
            VALUES (current_setting('app.current_tenant')::uuid, $1)
                RETURNING id, tenant_id, name, created_at
        `,
        [name]
    );
}

export async function getProjects(client, limit, offset) {
    return client.query(
        `
            SELECT id, tenant_id, name, created_at
            FROM projects
            ORDER BY created_at
                LIMIT $1
            OFFSET $2
        `,
        [limit, offset]
    );
}

export async function getProjectById(client, projectId) {
    return client.query(
        `
            SELECT id, tenant_id, name, created_at
            FROM projects
            WHERE id = $1
            LIMIT 1
        `,
        [projectId]
    );
}