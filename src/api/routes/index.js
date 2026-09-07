const express = require("express");

const healthRoutes = require("./healthRoutes");
const situationRoutes = require("./situationRoutes");
const trainingRoutes = require("./trainingRoutes");
const aiRoutes = require("./aiRoutes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/situations", situationRoutes);
router.use("/training", trainingRoutes);
router.use("/ai", aiRoutes);

module.exports = router;
