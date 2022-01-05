import { Router } from 'express';
import { param } from 'express-validator';
import validatorMiddleware from '../middlewares/validationResult';

import { findUserById, findUsers, removeUserById } from '../services/users';

const router = Router();

/* GET users listing. */
router.get("/", async function (_req, res, _next) {
  try {
    return res.status(200).json(await findUsers());
  } catch {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

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
)

export default router;
