'use strict';

const express = require('express');

const router = express.Router();

const simulationRoutes = require('./simulation');
const situationRoutes = require('./situation');
const terrainRoutes = require('./terrain');
const logisticsRoutes = require('./logistics');
const weatherRoutes = require('./weather');
const routingRoutes = require('./routing');
const trainingRoutes = require('./training');
const knowledgeRoutes = require('./knowledge');
const conversationRoutes = require('./conversation');

router.use('/simulation', simulationRoutes);
router.use('/situation', situationRoutes);
router.use('/terrain', terrainRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/weather', weatherRoutes);
router.use('/routing', routingRoutes);
router.use('/training', trainingRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/conversation', conversationRoutes);

module.exports = router;
