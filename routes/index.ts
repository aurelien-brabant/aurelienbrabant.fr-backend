import { Router } from 'express';
import { pool as db } from '../src/database/database';
import passport from 'passport';

const router = Router();

/* GET home page. */
router.get('/', passport.authenticate('jwt', { session: false }), function(_req, res) {
  res.send('BRONTE');
  //res.render('index', { title: 'Express' });
});

router.get('/testdb', async function(_req, _res) {
  const r = await db.query('SELECT NOW()');

  console.log(r);
});

export default router;
