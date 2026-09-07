const express = require("express");

const aiController = require("../controllers/aiController");

const router = express.Router();

router.post("/analyze", aiController.analyze);
router.post("/summarize", aiController.summarize);
router.post("/classify", aiController.classify);

module.exports = router;
