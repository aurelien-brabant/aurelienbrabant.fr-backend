import { Router } from "express";

import { findProjectByStringId, findProjects } from "../services/projects";

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

router.get("/search", async (req, res) => {
  const by: string | undefined = req.query.by as string;
  const payload: string | undefined = req.query.payload as string;
  let projectData: BrabantApi.Project | null = null;

  if (by && payload) {
    try {
      switch (by) {
        case "string_id":
          projectData = await findProjectByStringId(payload);

          break;
        default:
          return res.status(400).json({
            msg: `Could not find a project by ${by}`,
          });
      }

      if (!projectData) {
        return res.status(404).json({
          msg: `Could not find a project by ${by} with provided payload '${payload}'`,
        });
      }

      return res.status(200).json(projectData);
    } catch (e) {
      return res.json(500).send("Internal Server Error");
    }
  }

  return res.status(400).json({
    msg: `search route requires a 'by' and 'payload' query parameters`,
  });
});

export default router;
