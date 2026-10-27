'use strict';

const crypto = require('node:crypto');

const { getDatabaseConnection } = require('../database/DatabaseConnection');
const LedgerRepository = require('./LedgerRepository');
const LedgerEntry = require('./LedgerEntry');
const LedgerValidator = require('./LedgerValidator');
const WalletManager = require('../wallet/WalletManager');

class LedgerService {
  constructor({
    database = getDatabaseConnection(),
    ledgerRepository = new LedgerRepository(database),
    walletManager = new WalletManager(database)
  } = {}) {
    this.database = database;
    this.ledgerRepository = ledgerRepository;
    this.walletManager = walletManager;
  }

  async postTransfer({
    fromUserId,
    toUserId,
    amountMinor,
    currency = 'NGN',
    reference,
    description = 'Internal wallet transfer',
    idempotencyKey
  }) {
    const input = LedgerValidator.validateTransfer({
      fromUserId,
      toUserId,
      amountMinor,
      currency,
      reference,
      idempotencyKey
    });

    if (input.fromUserId === input.toUserId) {
      throw new Error(
        'Sender and recipient must be different.'
      );
    }

    const journalId = crypto.randomUUID();

    return this.database.withTransaction(
      async ({ db, session }) => {
        const existing =
          await this.ledgerRepository.findJournalByReference(
            input.reference,
            { session }
          );

        if (existing) {
          if (
            existing.idempotencyKey !== input.idempotencyKey ||
            existing.fromUserId !== input.fromUserId ||
            existing.toUserId !== input.toUserId ||
            existing.amountMinor !== input.amountMinor ||
            existing.currency !== input.currency
          ) {
            throw new Error(
              'Reference already exists with different transaction details.'
            );
          }

          return existing;
        }

        await this.walletManager.ensureWallet({
          userId: input.fromUserId,
          currency: input.currency,
          session
        });

        await this.walletManager.ensureWallet({
          userId: input.toUserId,
          currency: input.currency,
          session
        });

        /*
         * Atomically debit the sender.
         * The conditional update prevents a negative balance.
         */
        await this.walletManager.debit({
          userId: input.fromUserId,
          currency: input.currency,
          amountMinor: input.amountMinor,
          session
        });

        /*
         * Credit the recipient inside the same MongoDB
         * transaction as the sender's debit.
         */
        await this.walletManager.credit({
          userId: input.toUserId,
          currency: input.currency,
          amountMinor: input.amountMinor,
          session
        });

        const debitEntry = LedgerEntry.create({
          journalId,
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
          userId: input.fromUserId,
          counterpartyUserId: input.toUserId,
          direction: 'DEBIT',
          amountMinor: input.amountMinor,
          currency: input.currency,
          description,
          createdAt: new Date()
        });

        const creditEntry = LedgerEntry.create({
          journalId,
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
          userId: input.toUserId,
          counterpartyUserId: input.fromUserId,
          direction: 'CREDIT',
          amountMinor: input.amountMinor,
          currency: input.currency,
          description,
          createdAt: new Date()
        });

        await this.ledgerRepository.createMany(
          [debitEntry, creditEntry],
          { session }
        );

        const journal = {
          journalId,
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          amountMinor: input.amountMinor,
          currency: input.currency,
          status: 'POSTED',
          createdAt: new Date()
        };

        await db.collection('ledger_journals').insertOne(
          journal,
          { session }
        );

        return journal;
      }
    );
  }

  async getUserEntries({
    userId,
    currency,
    limit = 50,
    before
  }) {
    LedgerValidator.validateUserId(userId);

    return this.ledgerRepository.findByUser({
      userId,
      currency,
      limit,
      before
    });
  }

  async getJournal(reference) {
    LedgerValidator.validateReference(reference);

    return this.ledgerRepository.findJournalByReference(
      reference
    );
  }
}

module.exports = LedgerService;
