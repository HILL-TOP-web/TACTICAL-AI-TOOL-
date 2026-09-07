const express = require("express");

const trainingController = require("../controllers/trainingController");

const router = express.Router();

router.get("/", trainingController.getTrainingExercises);
router.get("/:id", trainingController.getTrainingExercise);
router.post("/", trainingController.createTrainingExercise);
router.put("/:id", trainingController.updateTrainingExercise);
router.delete("/:id", trainingController.deleteTrainingExercise);

module.exports = router;
