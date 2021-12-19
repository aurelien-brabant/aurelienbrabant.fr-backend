var express = require('express');
var router = express.Router();
const db = require('../src/database/database').pool;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/testdb', async function(req, res) {
  const r = await db.query('SELECT NOW()');

  console.log(r);
});

module.exports = router;
