import { Router } from "express";
import validatorMiddleware from "../middlewares/validationResult";
import { createUser } from "../services/users";
import { body } from "express-validator";

import { DEFAULT_USER_PICTURE_PATH } from "../utils/constants";

const router = Router();

router.post(
  "/",
  body("email").isEmail(),
  body("username").isLength({ min: 5, max: 25 }),
  body("password").isLength({ min: 8, max: 100 }),
  body("pictureURI").isString().isLength({ max: 255 }).optional(),
  validatorMiddleware,
  async (req, res) => {
    if (process.env.DISABLE_USER_REGISTRATION !== undefined) {
      return res
        .status(501)
        .json({ msg: "User registration has been disabled" });
    }

    const {
      email,
      username,
      password: plainTextPassword,
      pictureURI,
    } = req.body;

    try {
      return res
        .status(201)
        .json(
          await createUser(
            email,
            username,
            plainTextPassword,
            pictureURI ? pictureURI : DEFAULT_USER_PICTURE_PATH
          )
        );
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

export default router;
