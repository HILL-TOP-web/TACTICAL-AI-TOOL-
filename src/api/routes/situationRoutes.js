const express = require("express");

const situationController = require("../controllers/situationController");

const router = express.Router();

router.get("/", situationController.getSituations);
router.get("/:id", situationController.getSituation);
router.post("/", situationController.createSituation);
router.put("/:id", situationController.updateSituation);
router.delete("/:id", situationController.deleteSituation);

module.exports = router;
