import pool from "../db/pool.js";
import * as projectService from "../services/project.service.js";
import {withTenant} from "../db/withTenant.js";

export const insertProjectHandler = async (req, res) => {
    const {name} = req.body;

    if (!name) {
        return res.status(400).json({
            error: "Project name required"
        });
    }

    try {
        const project = await withTenant(req, async (client) => {
            return projectService.createProject(client, name);
        });

        res.status(201).json(project);
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({error: "Project already exists"});
        }
        console.error(err);
        res.status(500).json({error: "Internal server error"});
    }
};

export const getProjectsHandler = async (req, res) => {
    const {limit, offset} = req.body;

    try {

        const projects = await withTenant(req, async (client) => {
            return projectService.getProjects(client, limit, offset);
        });

        res.status(200).json(projects);

    } catch (err) {

        console.error(err);
        res.status(500).json({error: "Internal server error"});

    }
};

export const getProjectByIdHandler = async (req, res) => {
    const {projectId} = req.params;

    if (!projectId) {
        return res.status(400).json({error: "Project ID required"});
    }

    try {

        const project = await withTenant(req, async (client) => {
            return projectService.getProjectById(client, projectId);
        });

        res.status(200).json(project);

    } catch (err) {

        console.error(err);
        res.status(500).json({error: "Internal server error"});

    }
};
