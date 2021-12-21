import { Router } from "express";
import fileUpload from "express-fileupload";

import { body, param } from "express-validator";
import validatorMiddleware from "../middlewares/validationResult";

import {
  findBlogposts,
  removeBlogpostById,
  findBlogpostById,
  createBlogpost,
  createBlogpostFromMarkdown,
} from "../services/blogposts";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const posts = await findBlogposts();

    res.json(posts);
  } catch {
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/",
  body("title").isLength({ min: 10, max: 100 }),
  body("description").isLength({ min: 30, max: 300 }),
  body("coverImagePath").isLength({ min: 1, max: 255 }),
  body("authorId").isNumeric(),
  body("content").isString(),
  body("releaseTs").isDate().optional(),
  body("lastEditTs").isDate().optional(),
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
    } = req.body;

    try {
      const creationData = createBlogpost(
        authorId,
        title,
        description,
        content,
        coverImagePath,
        releaseTs !== undefined ? releaseTs : new Date(Date.now()),
        lastEditTs !== undefined ? lastEditTs : new Date(Date.now())
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
        const markdownData = (req.files[filename] as fileUpload.UploadedFile).data;

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
