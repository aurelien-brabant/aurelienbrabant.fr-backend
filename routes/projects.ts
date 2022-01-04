import { Router } from "express";

import { findProjects } from "../services/projects";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const projects = await findProjects();

    return res.status(200).json(projects);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

export default router;
