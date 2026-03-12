import {Router} from "express";
import {
    insertProjectHandler,
    getProjectsHandler,
    getProjectByIdHandler
} from "../controllers/project.controller.js";

const router = Router();

router.post('/', insertProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:projectId', getProjectByIdHandler);

export default router;