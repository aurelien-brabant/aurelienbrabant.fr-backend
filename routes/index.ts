import { Router } from 'express';
import { pool as db } from '../src/database/database';

var router = Router();

/* GET home page. */
router.get('/', function(_req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/testdb', async function(_req, _res) {
  const r = await db.query('SELECT NOW()');

  console.log(r);
});

export default router;
