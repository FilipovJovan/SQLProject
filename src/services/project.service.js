import * as projectRepo from '../db/projects.repo.js';

export const createProject = async (client, name) => {
    if (!name || !name.trim())
        throw new Error("Project name is required");

    if (name.length > 100)
        throw new Error("Project name too long");
    const projectResult = await projectRepo.insertProject(client, name);

    if (!projectResult.rows.length)
        throw new Error("Project insert failed");
    const project = projectResult.rows[0];
    return {id: project.id, tenantId: project.tenant_id, name: project.name, createdAt: project.created_at,};
}

export const getProjects = async (
    client,
    limit = 20,
    offset = 0
) => {
    const safeLimit = Math.min(Math.max(Number(limit), 1), 100);
    const safeOffset = Math.max(Number(offset), 0);

    const result = await projectRepo.getProjects(
        client,
        safeLimit,
        safeOffset
    );

    return result.rows.map(project => ({
        id: project.id,
        tenantId: project.tenant_id,
        name: project.name,
        createdAt: project.created_at,
    }));
};


export const getProjectById = async (client, projectId) => {
    const result = await projectRepo.getProjectById(client, projectId);
    const project = result.rows[0];
    if (!project) {
        return null;
    }
    return {id: project.id, tenantId: project.tenant_id, name: project.name, createdAt: project.created_at,};
};