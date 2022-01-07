import { Router } from "express";
import { body, param } from "express-validator";
import validationResultMiddleware from "../middlewares/validationResult";
import { editProject } from "../services/projects";
import {
  createProject,
  deleteProjectById,
  findProjectById,
  findProjects
} from "../services/projects";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const projects = await findProjects(false);

    return res.status(200).json(projects);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post(
  "/",
  body("name").isLength({ min: 1, max: 100 }),
  body("description").isLength({ min: 1, max: 300 }),
  body("role").isLength({ min: 1, max: 100}),
  body("content").isString(),
  body("coverURI").isLength({ min: 1, max: 255 }),
  body("startTs").isISO8601(),
  body("endTs").isISO8601().optional(),
  body("technologiesIds").isArray().isLength({ min: 0 }),
  body("githubLink").isLength({ min: 1, max: 255 }).optional({ nullable: true }),
  body("gitlabLink").isLength({ min: 1, max: 255 }).optional({ nullable: true}),
  body("companyName").isLength({ min: 1, max: 255 }).optional({ nullable: true}),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        role,
        companyName,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
        gitlabLink,
        githubLink
      } = req.body;
      const projectData = await createProject(
        name,
        description,
        role,
        companyName,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
        gitlabLink,
        githubLink
      );

      return res.status(201).json(projectData);
    } catch (e) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

router.get(
  "/:id",
  param("id").isNumeric(),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const projectData = await findProjectById(req.params.id, false);

      if (!projectData) {
        return res.status(404).json({ msg: "No such project" });
      }

      return res.status(200).json(projectData);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

router.patch(
  "/:id",
  param("id").isNumeric(),
  body("name").isString().isLength({ min: 1, max: 100 }).optional(),
  body("description").isLength({ min: 1, max: 300 }).optional(),
  body("role").isLength({ min: 1, max: 100}),
  body("content").isString().optional(),
  body("coverURI").isLength({ min: 1, max: 255 }).optional(),
  body("startTs").isISO8601().optional(),
  body("endTs").isISO8601().optional(),
  body("technologiesIds").isArray().isLength({ min: 0 }).optional(),
  body('privacy').isIn(['PRIVATE', 'PRIVATE-PREV', 'PUBLIC']).optional(),
  body("githubLink").isLength({ min: 1, max: 255 }).optional({ nullable: true }),
  body("gitlabLink").isLength({ min: 1, max: 255 }).optional({ nullable: true}),
  body("companyName").isLength({ min: 1, max: 255 }).optional({ nullable: true}),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        role,
        companyName,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
        privacy,
        gitlabLink,
        githubLink
      } = req.body;
      await editProject(
        req.params.id,
        name,
        description,
        role,
        companyName,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
        privacy as 'PRIVATE' | 'PRIVATE-PREV' | 'PUBLIC',
        gitlabLink,
        githubLink
      );

      return res.status(200).json({ msg: 'project patch OK' });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

router.delete(
  "/:id",
  param("id").isNumeric(),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const _deleted = await deleteProjectById(req.params.id);

      return res.status(200);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

export default router;
