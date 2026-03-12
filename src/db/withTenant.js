import pool from './pool.js';

export async function withTenant(req, callback) {
    const tenantId = req.context?.tenantId;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            "SELECT set_config('app.current_tenant', $1, true)",
            [tenantId]
        );

        const result = await callback(client);

        await client.query("COMMIT");
        return result;

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;

    } finally {
        client.release();
    }
}