import { Router } from "express";
import { body } from "express-validator";
import recaptcha2 from "../middlewares/recaptcha2";
import validationResultMiddleware from "../middlewares/validationResult";
import { sendContactData } from "../services/contact";

const router = Router();

router.post(
  "/",

  body("email").isEmail(),
  body("name").isString(),
  body("message").isString(),
  recaptcha2,
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
