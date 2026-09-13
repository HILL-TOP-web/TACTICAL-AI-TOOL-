'use strict';

const express = require('express');

const {
  createSituationReport,
  getSituationReport
} = require('../controllers/situationController');

const router = express.Router();

router.post('/report', createSituationReport);
router.get('/report', getSituationReport);

module.exports = router;
