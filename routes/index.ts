import { Router } from 'express';

const router = Router();

/* GET home page. */
router.get('/', (_req, res) => {
  res.status(200).json({ 'apiVersion': '1.0'});
});

export default router;
