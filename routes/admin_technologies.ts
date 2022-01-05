import { Router } from "express";
import { param, body } from "express-validator";
import {
  createTechnology,
  editTechnologyById,
  findTechnologyById,
} from "../services/technologies";

import validationResultMiddleware from "../middlewares/validationResult";

const router = Router();

router.post(
  "/",
  body("name").isLength({ min: 3, max: 50 }),
  body("logoURI").isLength({ min: 1, max: 255 }),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const { name, logoURI } = req.body;
      const technology = await createTechnology(name, logoURI);

      return res.status(200).json(technology);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

router.get("/:id", param("id").isNumeric(), async (req, res) => {
  try {
    const technology = await findTechnologyById(req.params.id);

    return res.status(200).json(technology);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.patch(
  "/:id",
  param("id").isNumeric(),
  body("name").isLength({ min: 3, max: 50 }).optional(),
  body("logoURI").isLength({ min: 1, max: 255 }).optional(),
  validationResultMiddleware,
  async (req, res) => {
    try {
      const { name, logoURI } = req.body;

      const technology = await editTechnologyById(req.params.id, name, logoURI);

      return res.status(200).json(technology);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

export default router;
