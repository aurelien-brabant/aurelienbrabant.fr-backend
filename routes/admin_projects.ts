import { Router } from "express";
import { body, param } from "express-validator";
import validationResultMiddleware from "../middlewares/validationResult";
import { editProject } from "../services/projects";
import {
  createProject,
  deleteProjectById,
  findProjectById,
} from "../services/projects";

const router = Router();

router.post(
  "/",
  body("name").isLength({ min: 1, max: 100 }),
  body("description").isLength({ min: 1, max: 300 }),
  body("content").isString(),
  body("coverURI").isLength({ min: 1, max: 255 }),
  body("startTs").isISO8601(),
  body("endTs").isISO8601(),
  body("technologiesIds").isArray().isLength({ min: 0 }),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
      } = req.body;
      const projectData = await createProject(
        name,
        description,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds
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
      const projectData = await findProjectById(req.params.id);

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
  body("content").isString().optional(),
  body("coverURI").isLength({ min: 1, max: 255 }).optional(),
  body("startTs").isISO8601().optional(),
  body("endTs").isISO8601().optional(),
  body("technologiesIds").isArray().isLength({ min: 0 }).optional(),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds,
      } = req.body;
      await editProject(
        req.params.id,
        name,
        description,
        content,
        coverURI,
        startTs,
        endTs,
        technologiesIds
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
