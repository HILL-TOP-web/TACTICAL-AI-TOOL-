'use strict';

class TransferController {
    constructor(transferService) {
        if (
            !transferService ||
            typeof transferService.createTransfer !== 'function'
        ) {
            throw new Error(
                'TransferController requires a transferService with createTransfer().'
            );
        }

        this.transferService = transferService;

        this.createTransfer = this.createTransfer.bind(this);
        this.getTransfer = this.getTransfer.bind(this);
        this.getUserTransfers = this.getUserTransfers.bind(this);
    }

    /**
     * Submit a transfer request.
     *
     * The service is responsible for checking balances,
     * authorizing the transaction, and contacting Monnify
     * when the transfer method requires it.
     */
    async createTransfer(req, res, next) {
        try {
            const request = {
                userId: req.user && req.user.id,
                recipientAccountNumber:
                    req.body && req.body.recipientAccountNumber,
                recipientBankCode:
                    req.body && req.body.recipientBankCode,
                recipientName:
                    req.body && req.body.recipientName,
                amount: req.body && req.body.amount,
                currency: req.body && req.body.currency,
                reference: req.body && req.body.reference,
                idempotencyKey:
                    req.get('Idempotency-Key') ||
                    (req.body && req.body.idempotencyKey)
            };

            const result =
                await this.transferService.createTransfer(request);

            return res.status(202).json({
                success: true,
                message:
                    'Transfer request accepted for processing.',
                data: result
            });
        } catch (error) {
            return this.handleError(error, res, next);
        }
    }

    /**
     * Retrieve a transfer by its ID.
     */
    async getTransfer(req, res, next) {
        try {
            if (
                !this.transferService ||
                typeof this.transferService.getTransfer !== 'function'
            ) {
                throw new Error(
                    'Transfer lookup is not configured.'
                );
            }

            const userId = req.user && req.user.id;
            const transferId = req.params.transferId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication is required.'
                });
            }

            const transfer =
                await this.transferService.getTransfer({
                    userId,
                    transferId
                });

            if (!transfer) {
                return res.status(404).json({
                    success: false,
                    error: 'Transfer not found.'
                });
            }

            return res.status(200).json({
                success: true,
                data: transfer
            });
        } catch (error) {
            return this.handleError(error, res, next);
        }
    }

    /**
     * Retrieve the authenticated user's transfer history.
     */
    async getUserTransfers(req, res, next) {
        try {
            if (
                !this.transferService ||
                typeof this.transferService.getUserTransfers !==
                    'function'
            ) {
                throw new Error(
                    'Transfer history is not configured.'
                );
            }

            const userId = req.user && req.user.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication is required.'
                });
            }

            const result =
                await this.transferService.getUserTransfers({
                    userId,
                    limit: req.query.limit,
                    cursor: req.query.cursor
                });

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return this.handleError(error, res, next);
        }
    }

    handleError(error, res, next) {
        if (typeof next === 'function') {
            return next(error);
        }

        const statusCode = Number.isInteger(error.statusCode)
            ? error.statusCode
            : 500;

        return res.status(statusCode).json({
            success: false,
            error:
                statusCode >= 500
                    ? 'An internal transfer error occurred.'
                    : error.message
        });
    }
}

module.exports = TransferController;
