import { Router } from "express";
import validatorMiddleware from "../middlewares/validationResult";
import {
  findUsers,
  findUserById,
  removeUserById,
  createUser,
} from "../services/users";
import { body, param } from "express-validator";

import { DEFAULT_USER_PICTURE_PATH } from "../utils/constants";

const router = Router();

/* GET users listing. */
router.get("/", async function (_req, res, _next) {
  try {
    return res.json(await findUsers());
  } catch {
    return res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/",
  body("email").isEmail(),
  body("username").isLength({ min: 5, max: 25 }),
  body("password").isLength({ min: 8, max: 100 }),
  body("pictureURI").isString().isLength({ max: 255 }).optional(),
  validatorMiddleware,
  async (req, res) => {
    const { email, username, password: plainTextPassword, pictureURI } = req.body;

    try {
      return res.json(await createUser(email, username, plainTextPassword, pictureURI ? pictureURI : DEFAULT_USER_PICTURE_PATH));
    } catch (e) {
      console.error(e);
      return res.status(500).send("Internal Server Error");
    }
  }
);

router.get(
  "/:id",
  param("id").isNumeric(),
  validatorMiddleware,
  async (req, res) => {
    const id = req.params.id;

    try {
      const userData = await findUserById(id);

      if (!userData) {
        return res.status(404).send("Not found");
      }

      return res.json(userData);
    } catch (e) {
      console.log(e);
      return res.status(500).send("Internal Server Error");
    }
  }
);

router.delete(
  "/:id",
  param("id").isNumeric(),
  validatorMiddleware,
  async (req, res) => {
    const id = req.params.id;

    try {
      const _deleted = await removeUserById(id);

      return res.status(200).send();
    } catch (e) {
      console.error(e);
      return res.status(500).send("Internal Server Error");
    }
  }
);

export default router;
