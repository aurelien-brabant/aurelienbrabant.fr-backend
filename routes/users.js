var express = require("express");
var router = express.Router();

const userServices = require("../services/users");

/* GET users listing. */
router.get("/", async function (_req, res, _next) {
  try {
    return res.json(await userServices.findUsers());
  } catch {
    return res.status(500).send("Internal Server Error");
  }
});

router.post("/", async (req, res) => {
  const { email, username, password: plainTextPassword } = req.body;

  try {
    return res.json(
      await userServices.createUser(email, username, plainTextPassword)
    );
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const userData = await userServices.findUserById(id);

    console.log(userData);

    if (!userData) {
      return res.status(404).send("Not found");
    }

    return res.json(userData);
  } catch (e) {
    return res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  try {
   const deleted = await userServices.removeUserById(id);

    return res.status(200).send();
  } catch {
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
