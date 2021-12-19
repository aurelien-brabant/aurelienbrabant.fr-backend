const express = require('express');
const router = express.Router();

const blogpostServices = require('../services/blogposts');

router.get('/', async (_req, res) => {
  try {
    const posts = await blogpostServices.findBlogposts();
    
    return res.json(posts);
  } catch {
    res.status(500).send('Internal Server Error');
  }
});

router.post('/', (req, res) => {
});

router.get('/:id', (req, res) => {
});

router.patch('/:id', (req, res) => {
});

router.delete('/:id', (req, res) => {
});

module.exports = router;
