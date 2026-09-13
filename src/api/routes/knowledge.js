'use strict';

const express = require('express');

const {
  searchKnowledge,
  askKnowledge
} = require('../controllers/knowledgeController');

const router = express.Router();

router.get('/search', searchKnowledge);
router.post('/ask', askKnowledge);

module.exports = router;
