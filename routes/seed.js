const { Router } = require("express");
const { seed } = require("../controllers/seed");

const router = Router();

router.get("/", [], seed);

module.exports = router;
