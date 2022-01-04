import { pool as db } from "../src/database/database";

import { body } from "express-validator";

import jwt from "jsonwebtoken";
import passport from 'passport';

import validationResultMiddleware from "../middlewares/validationResult";

import { compare as comparePassword } from "bcrypt";
import { Router } from "express";

const router = Router();

/**
 * Get currently logged in user
 */

router.get('/login', passport.authenticate('jwt', { session: false }), async (req, res) => {
  return res.status(200).json(req.user);
});

router.post(
  "/login",
  body("login").isLength({ min: 5, max: 70 }),
  body("password").isLength({ min: 8, max: 100 }),
  validationResultMiddleware,
  async (req, res) => {

    console.log(req.body.login, req.body.password);
    const qres = await db.query(
      `SELECT user_id, role, password FROM user_account WHERE email = $1 OR username = $1`,
      [req.body.login]
    );

    if (
      qres.rows.length === 0 ||
      !await comparePassword(req.body.password, qres.rows[0].password)
    ) {
      return res.status(401).json({
        msg: "Invalid credentials",
      });
    }

    const row = qres.rows[0];

    const accessToken = jwt.sign(
      { sub: row.user_id, role: parseInt(row.role) },
      process.env.JWT_SECRET
    );

    return res.status(201).json({ accessToken });
  }
);

export default router;
