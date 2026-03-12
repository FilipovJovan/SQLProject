import * as itemRepo from '../db/items.repo.js';
import * as projectRepo from '../db/projects.repo.js';
import {BadRequestError} from '../errors/badRequest.error.js';
import {NotFoundError} from '../errors/notFound.error.js'

export const insertItem = async (client, projectId, title) => {
    if (!title) {
        throw new Error("Item title is required");
    }

    const itemResult = await itemRepo.insertItem(client, projectId, title);
    const item = itemResult.rows[0];
    return {
        id: item.id,
        projectId: item.project_id,
        title: item.title,
        status: item.status,
        createdAt: item.created_at,
    };
}

export const bulkCreateItems = async (client, projectId, items) => {
    if (!projectId) {
        throw new BadRequestError("Project ID is required")
    }

    if (!Array.isArray(items) || items.length === 0) {
        return {rows: []};
    }

    items.forEach((item, i) => {
        if (!item.title) {
            throw new BadRequestError(`Item at index ${i} is missing a title`);
        }
    });

    const result = await itemRepo.bulkInsertItems(client, projectId, items.map(i => i.title));
    console.log(result);
    return result.rows;
}

export const getItemsByProjectService = async (client, projectId, options = {}) => {
    if (!projectId) {
        throw new BadRequestError("Project ID is required");
    }

    const result = await itemRepo.getItemsByProject(client, projectId, options);
    return result.rows;
};

export const updateItemStatus = async (client, itemId, status) => {
    if (!itemId) {
        throw new BadRequestError("Item ID is required");
    }
    if (!status) {
        throw new BadRequestError("Status is required");
    }

    const result = await itemRepo.updateItemStatus(client, itemId, status);

    if (result.rows.length === 0) {
        throw new NotFoundError("Item not found or does not belong to this tenant");
    }

    return result.rows[0];
}