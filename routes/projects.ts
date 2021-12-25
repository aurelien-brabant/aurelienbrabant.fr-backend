import { Router } from 'express';

import { findProjects } from '../services/projects';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projects = await findProjects();

    return res.json(projects);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
