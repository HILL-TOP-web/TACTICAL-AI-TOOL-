'use strict';

const TransactionService = require('./TransactionService');
const TransactionHistory = require('./TransactionHistory');
const TransactionValidator = require('./TransactionValidator');

class TransactionController {
  constructor({
    transactionService = new TransactionService(),
    transactionHistory = new TransactionHistory(),
    validator = new TransactionValidator()
  } = {}) {
    this.transactionService = transactionService;
    this.transactionHistory = transactionHistory;
    this.validator = validator;

    this.create = this.create.bind(this);
    this.getByReference = this.getByReference.bind(this);
    this.getHistory = this.getHistory.bind(this);
  }

  async create(req, res, next) {
    try {
      this.validator.validateCreate(req.body);

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication is required.'
        });
      }

      const transaction =
        await this.transactionService.create(
          req.body,
          {
            userId: String(req.user.id),
            role: req.user.role
          }
        );

      return res.status(201).json({
        success: true,
        message: 'Transaction record created.',
        data: transaction
      });
    } catch (error) {
      return next(error);
    }
  }

  async getByReference(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication is required.'
        });
      }

      const transaction =
        await this.transactionHistory.getTransaction(
          req.params.reference,
          {
            userId: String(req.user.id),
            role: req.user.role
          }
        );

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      return next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication is required.'
        });
      }

      const records =
        await this.transactionHistory.getUserHistory(
          String(req.user.id),
          {
            limit: req.query.limit,
            offset: req.query.offset
          }
        );

      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = TransactionController;
