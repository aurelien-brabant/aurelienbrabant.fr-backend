import { Router } from "express";
import fileUpload from "express-fileupload";

import { body, param } from "express-validator";
import validationResultMiddleware from "../middlewares/validationResult";
import validatorMiddleware from "../middlewares/validationResult";

import {
  findBlogposts,
  removeBlogpostById,
  findBlogpostById,
  findBlogpostByStringId,
  createBlogpost,
  createBlogpostFromMarkdown,
  getTags,
  hasAuthorBlogpostWithTitle,
  editBlogpost,
} from "../services/blogposts";
import buildPatchQuery from "../src/database/buildPatchQuery";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const posts = await findBlogposts(),
      tags = await getTags();

    return res.json({
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

    return res.json(tags);
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

      return res.json(blogpostData);
    } catch (e) {
      return res.json(500).send("Internal Server Error");
    }
  }

  return res.status(400).json({
    msg: `search route requires a 'by' and 'payload' query parameters`,
  });
});

router.post(
  "/",
  body("title").isLength({ min: 10, max: 100 }),
  body("description").isLength({ min: 30, max: 300 }),
  body("coverImagePath").isLength({ min: 1, max: 255 }),
  body("authorId").isNumeric(),
  body("releaseTs").isDate().optional(),
  body("lastEditTs").isDate().optional(),
  body("content").isString(),
  body("tags").isArray().optional(),
  validatorMiddleware,
  async (req, res) => {
    const {
      title,
      description,
      coverImagePath,
      authorId,
      content,
      releaseTs,
      lastEditTs,
      tags,
    } = req.body;

    try {
      if (await hasAuthorBlogpostWithTitle(authorId, title)) {
        return res.status(409).json([
          {
            field: "title",
            msg: `This user already has a blogpost entitled "${title}"`,
          },
        ]);
      }

      const creationData = createBlogpost(
        authorId,
        title,
        description,
        content,
        coverImagePath,
        releaseTs !== undefined ? releaseTs : new Date(Date.now()),
        lastEditTs !== undefined ? lastEditTs : new Date(Date.now()),
        tags ? tags : []
      );

      return res.json(creationData);
    } catch (e) {
      console.error(e);
      return res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/:id", param("id").isNumeric(), async (req, res) => {
  const id = req.params.id;

  try {
    const blogpostData = await findBlogpostById(id);

    if (blogpostData === null) {
      return res.status(404).json({ msg: "No such blogpost" });
    }

    return res.json(blogpostData);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal server error");
  }
});



export default router;