import pool from '../db/pool.js';
import * as itemService from '../services/item.service.js';
import {withTenant} from "../db/withTenant.js";

export const insertItemHandler = async (req, res) => {
    const {title} = req.body;
    const projectIdObject = req.params;
    const projectId = projectIdObject.projectId;

    if (!title) {
        return res.status(400).json({error: 'Title is required'});
    }

    const client = await pool.connect();

    const project = await client.query(
        `SELECT id
         FROM projects
         WHERE id = $1
           AND tenant_id = $2`,
        [projectId, req.context.tenantId]
    );

    if (project.rowCount === 0) {
        return res.status(403).json({error: 'Project not found or unauthorized'});
    }

    try {
        await client.query("BEGIN");
        const item = await itemService.insertItem(client, projectId, title);
        await client.query("COMMIT");

        res.status(201).json(item);
    } catch (err) {
        await client.query("ROLLBACK");

        if (err.code === '23505') {
            return res.status(409).json({error: 'Item already exists'});
        }
        console.error(err);
        res.status(500).json({error: "Internal server error"});

    } finally {
        client.release();
    }
}

export const bulkInsertItemsHandler = async (req, res, next) => {
    const {projectId} = req.params;
    const items = req.body;
    const tenantId = req.context.tenantId;

    if (!Array.isArray(items))
        return res.status(400).json({error: "Body must be array of items"});

    const client = await pool.connect();

    const project = await client.query(
        `SELECT id
         FROM projects
         WHERE id = $1
           AND tenant_id = $2`,
        [projectId, req.context.tenantId]
    );

    if (project.rowCount === 0) {
        return res.status(403).json({error: 'Project not found or unauthorized'});
    }

    try {
        await client.query("BEGIN");

        const projectCheck = await client.query(
            `SELECT 1
             FROM projects
             WHERE id = $1
               AND tenant_id = $2`,
            [projectId, tenantId]
        );

        if (projectCheck.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({error: "Project not found"});
        }

        const result = await itemService.bulkCreateItems(client, projectId, items);
        console.log(result);

        await client.query("COMMIT");

        res.status(201).json({
            inserted: result.length,
            items: result
        });

    } catch (err) {
        await client.query("ROLLBACK");

        if (err.code === "23503")
            return res.status(404).json({error: "Invalid project id"});

        if (err.code === "22P02")
            return res.status(400).json({error: "Invalid id format"});

        console.error(err);
        res.status(500).json({error: "Internal server error"});

    } finally {
        client.release();
    }
};


export const getItemsByProjectHandler = async (req, res, next) => {
    const projectIdObject = req.params;
    const projectId = projectIdObject.projectId;
    const {status, limit, offset} = req.query;

    if (!projectId) {
        return res
            .status(400)
            .send({error: "Project ID is required"});
    }

    try {
        const items = await withTenant(req, async (client) => {
            return itemService.getItemsByProjectService(client, projectId, {status, limit, offset});
        });
        return res.status(200).json(items);
    } catch (err) {
        next(err);
    }
}

export const updateItemStatusHandler = async (req, res, next) => {
    const itemIdObject = req.params;
    const itemId = itemIdObject.itemId;
    const status = req.body.status;


    try {
        const updatedItem = await withTenant(req, async (client) => {
            return itemService.updateItemStatus(client, itemId, status);
        });
        return res.status(201).json(updatedItem);
    } catch (err) {
        next(err);
    }
}