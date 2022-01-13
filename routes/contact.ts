import { Router } from "express";
import { body } from "express-validator";
import validationResultMiddleware from "../middlewares/validationResult";
import { sendContactData } from "../services/contact";

const router = Router();

router.post(
  "/",

  body("email").isEmail(),
  body("name").isString(),
  body("message").isString(),
  validationResultMiddleware,

  async (req, res) => {
    const { email, name, message } = req.body;

    try {
      await sendContactData(email, name, message);

      return res.status(201).json({ msg: "Contact mail has been sent" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Failed to send mail" });
    }
  }
);

export default router;
