import { Router } from "express";

import { param } from "express-validator";

import {
  findBlogposts,
  findBlogpostByStringId,
  findBlogpostById,
  getTags,
} from "../services/blogposts";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const posts = await findBlogposts(),
      tags = await getTags();

    return res.status(200).json({
      tags,
      posts,
    });
  } catch {
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/tags", async (_req, res) => {
  try {
    const tags = await getTags();

    return res.status(200).json(tags);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/search", async (req, res) => {
  const by: string | undefined = req.query.by as string;
  const payload: string | undefined = req.query.payload as string;
  let blogpostData: BrabantApi.BlogpostData | null = null;

  console.log(req.query);

  if (by && payload) {
    try {
      switch (by) {
        case "string_id":
          blogpostData = await findBlogpostByStringId(payload);

          break;
        default:
          return res.status(400).json({
            msg: `Could not find a blogpost by ${by}`,
          });
      }

      if (!blogpostData) {
        return res.status(404).json({
          msg: `Could not find a blogpost by ${by} with provided payload '${payload}'`,
        });
      }

      return res.status(200).json(blogpostData);
    } catch (e) {
      return res.json(500).send("Internal Server Error");
    }
  }

  return res.status(400).json({
    msg: `search route requires a 'by' and 'payload' query parameters`,
  });
});

router.get("/:id", param("id").isNumeric(), async (req, res) => {
  const id = req.params.id;

  try {
    const blogpostData = await findBlogpostById(id);

    if (blogpostData === null) {
      return res.status(404).json({ msg: "No such blogpost" });
    }

    return res.status(200).json(blogpostData);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal server error");
  }
});

export default router;
