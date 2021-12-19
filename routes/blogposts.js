const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const blogpostServices = require("../services/blogposts");

router.get("/", async (_req, res) => {
  try {
    const posts = await blogpostServices.findBlogposts();

    return res.json(posts);
  } catch {
    res.status(500).send("Internal Server Error");
  }
});

router.post("/", fileUpload({ limits: { fileSize: 1048576 } }), (req, res) => {
  const filenames = Object.keys(req.files);

  if (filenames.length > 0) {
    for (const filename of filenames) {
      const markdownData = req.files[filename].data;
      blogpostServices.createBlogpostFromMarkdown(markdownData.toString());
    }

    return res.send('Created entries for all the uploaded files');
  }

  return res.status(400).send("Only file upload is supported yet");

});

router.get("/:id", (req, res) => {});

router.patch("/:id", (req, res) => {});

router.delete("/:id", (req, res) => {});

module.exports = router;
