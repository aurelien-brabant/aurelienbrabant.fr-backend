import { Router } from "express";
import fileUpload from "express-fileupload";
import { body, param } from "express-validator";
import validationResultMiddleware from "../middlewares/validationResult";
import {
  createBlogpostFromMarkdown,
  editBlogpost,
  findBlogpostById,
  findBlogposts,
  removeBlogpostById,
  getTags,
  createBlogpost,
  hasAuthorBlogpostWithTitle
} from "../services/blogposts";

const router = Router();

/**
 * Retrieve all the blogposts without caring about the privacy of it
 */

router.get("/", async (_req, res) => {
  try {
    const posts = await findBlogposts(false);
    const tags = await getTags();

    return res.status(200).json({ tags, posts });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

/**
 * From a specifically formatted markdown post, create its corresponding representation in database
 */

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

      return res.status(201).json({ uploaded });
    }

    return res.status(400).json({ error: "No file to upload" });
  }
);

/**
 * Retrieve a post by id, which is reserved to user with administrative rights.
 * Doesn't take 'privacy' field into account.
 */

router.get("/:id", param("id").isNumeric(), async (req, res) => {
  const id = req.params.id;

  try {
    const blogpostData = await findBlogpostById(id, false);

    if (blogpostData === null) {
      return res.status(404).json({ msg: "No such blogpost" });
    }

    return res.status(200).json(blogpostData);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal server error");
  }
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
  validationResultMiddleware,
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


/**
 * Partial or complete edit of blogpost fields, including privacy.
 */

router.patch(
  "/:id",
  param("id").isNumeric(),
  body("title").optional().isLength({ min: 10, max: 100 }),
  body("description").optional().isLength({ min: 30, max: 300 }),
  body("coverImagePath").optional().isLength({ min: 1, max: 255 }),
  body("content").optional().isString(),
  body("tags").optional().isArray(),
  body("privacy").optional().isIn(["PRIVATE-PREV", "PRIVATE", "PUBLIC"]),
  validationResultMiddleware,
  async (req, res) => {
    const { title, description, coverImagePath, content, tags, privacy } =
      req.body;

    try {
      await editBlogpost(
        req.params.id,
        title,
        description,
        content,
        coverImagePath,
        privacy,
        tags
      );

      return res.status(200).json({ msg: "PATCH ok" });
    } catch (e) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

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
