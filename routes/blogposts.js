const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const { body, param } = require("express-validator");
const validatorMiddleware = require("../middlewares/validationResult");

const blogpostServices = require("../services/blogposts");

router.get("/", async (_req, res) => {
  try {
    const posts = await blogpostServices.findBlogposts();

    return res.json(posts);
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
      const creationData = blogpostServices.createBlogpost(
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
        const markdownData = req.files[filename].data;

        const errors = await blogpostServices.createBlogpostFromMarkdown(
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

router.get("/:id",
  param('id').isNumeric(),
  async (req, res) => {
    const id = req.params.id;

    try {
      const blogpostData = await blogpostServices.findBlogpostById(id);

      if (blogpostData === null) {
        return res.status(404).json({ msg: 'No such blogpost' });
      }

      return res.json(blogpostData);
    } catch (e) {
      console.error(e);
      return res.status(500).send("Internal server error");
    }
  });

router.delete("/:id",
  param('id').isNumeric(),
  async (req, res) => {
  const { id } = req.params;
  try {
    const _deleted = await blogpostServices.removeBlogpostById(id);

    return res.status(200).json({});
  } catch (e) {
    console.error(e);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
