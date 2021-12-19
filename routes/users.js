var express = require("express");
var router = express.Router();

const userServices = require("../src/database/user");

/* GET users listing. */
router.get("/", async function (_req, res, _next) {
  try {
    return res.json(await userServices.findUsers());
  } catch {
    return res.status(500).send("Internal Server Error");
  }
});

router.post('/', async (req, res) => {
  const { email, username, password: plainTextPassword } = req.body;

  try {
    return res.json(await userServices.createUser(email, username, plainTextPassword));
  } catch(e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
