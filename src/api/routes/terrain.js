'use strict';

const express = require('express');

const {
  analyzeTerrain,
  getTerrainInfo
} = require('../controllers/terrainController');

const router = express.Router();

router.post('/analyze', analyzeTerrain);
router.get('/info', getTerrainInfo);

module.exports = router;
