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

// NOTE: apply same validation constraints as POST /blogposts

router.post(
  "/markdown",
  fileUpload({ limits: { fileSize: 1048576 } }),
  async (req, res) => {
    if (!req.files) {
      return res.status(400).json({ msg: "No markdown file provided" });
    }

    const filenames = Object.keys(req.files);

    if (filenames.length > 0) {
      const uploaded = [];

      for (const filename of filenames) {
        const markdownData = (req.files[filename] as fileUpload.UploadedFile)
          .data;

        const errors = await createBlogpostFromMarkdown(
          markdownData.toString()
        );

        if (errors.length) {
          return res.status(400).json({ errors });
        }

        uploaded.push(filename);
      }

      return res.json({ uploaded });
    }

    return res.status(400).json({ error: "No file to upload" });
  }
);

router.patch('/:id',
param('id').isNumeric(),
body("title").optional().isLength({ min: 10, max: 100 }),
body("description").optional().isLength({ min: 30, max: 300 }),
body("coverImagePath").optional().isLength({ min: 1, max: 255 }),
body("content").optional().isString(),
body("tags").optional().isArray(),
body('privacy').optional().isIn(['PRIVATE-PREV', 'PRIVATE', 'PUBLIC']),
validationResultMiddleware,
async (req, res) => {
  const { title, description, coverImagePath, content, tags, privacy } = req.body;

  try {
    await editBlogpost(req.params.id, title, description, content, coverImagePath, privacy, tags);

    return res.json({ msg: 'PATCH ok' });
  } catch (e) {
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

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

router.delete("/:id", param("id").isNumeric(), async (req, res) => {
  const { id } = req.params;
  try {
    const _deleted = await removeBlogpostById(id);

    return res.status(200).json({});
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

export default router;
