import { Router } from "express";

import { findTechnologies } from "../services/technologies";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const technologies = await findTechnologies();

    return res.status(200).json(technologies);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

export default router;
