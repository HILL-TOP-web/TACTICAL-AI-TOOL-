'use strict';

class TransferController {
  constructor({ transferService }) {
    if (!transferService) {
      throw new Error('TransferService is required.');
    }

    this.transferService = transferService;

    this.createTransfer = this.createTransfer.bind(this);
    this.getTransfer = this.getTransfer.bind(this);
    this.getTransferHistory = this.getTransferHistory.bind(this);
  }

  getAuthenticatedUserId(req) {
    const userId = req.user && (
      req.user.id || req.user._id
    );

    if (!userId) {
      const error = new Error('Authentication is required.');
      error.code = 'AUTHENTICATION_REQUIRED';
      error.statusCode = 401;
      throw error;
    }

    return String(userId);
  }

  async createTransfer(req, res, next) {
    try {
      const userId = this.getAuthenticatedUserId(req);

      const transfer = await this.transferService.createTransfer({
        userId,
        input: req.body
      });

      return res.status(202).json({
        success: true,
        message: 'Transfer request accepted for processing.',
        data: transfer
      });
    } catch (error) {
      return next(error);
    }
  }

  async getTransfer(req, res, next) {
    try {
      const userId = this.getAuthenticatedUserId(req);

      const transfer = await this.transferService.getTransfer({
        userId,
        reference: req.params.reference
      });

      return res.status(200).json({
        success: true,
        data: transfer
      });
    } catch (error) {
      return next(error);
    }
  }

  async getTransferHistory(req, res, next) {
    try {
      const userId = this.getAuthenticatedUserId(req);

      const history = await this.transferService.getTransferHistory({
        userId,
        limit: req.query.limit,
        cursor: req.query.cursor
      });

      return res.status(200).json({
        success: true,
        data: history.items,
        pagination: {
          nextCursor: history.nextCursor
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = TransferController;
