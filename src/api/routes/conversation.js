'use strict';

const express = require('express');

const {
  processMessage,
  getConversationStatus
} = require('../controllers/conversationController');

const router = express.Router();

router.post('/message', processMessage);
router.get('/status', getConversationStatus);

module.exports = router;
