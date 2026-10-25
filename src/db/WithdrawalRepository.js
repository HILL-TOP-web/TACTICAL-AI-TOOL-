'use strict';

const { pool } = require('./pool');

function toKobo(amountNgn) {
  const amount = Number(amountNgn);

  if (
    !Number.isFinite(amount) ||
    Math.round(amount * 100) !== amount * 100
  ) {
    throw new Error('Invalid NGN amount.');
  }

  return Math.round(amount * 100);
}

function toPublicRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: String(row.user_id),
    amountNgn: Number(row.amount_kobo) / 100,
    currency: row.currency,
    reference: row.reference,
    providerReference: row.provider_reference,
    status: row.status,
    providerStatus: row.provider_status,
    destinationBankCode: row.destination_bank_code,
    destinationAccountNumber:
      row.destination_account_number,
    destinationAccountName:
      row.destination_account_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    failureCode: row.failure_code || undefined
  };
}

class WithdrawalRepository {
  constructor(db = pool) {
    this.db = db;
  }

  async createAndReserve(input) {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const amountKobo = toKobo(
        input.amountNgn
      );

      // Lock the wallet before checking the idempotency key.
      // This prevents concurrent requests from reserving the same funds.
      const walletResult = await client.query(
        `SELECT user_id, available_balance_kobo
         FROM skydrop_wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [input.userId]
      );

      if (!walletResult.rowCount) {
        const error = new Error(
          'SkyDrop wallet was not found for this user.'
        );

        error.statusCode = 404;
        throw error;
      }

      const priorResult = await client.query(
        `SELECT *
         FROM skydrop_withdrawals
         WHERE user_id = $1
           AND idempotency_key = $2
         LIMIT 1`,
        [
          input.userId,
          input.idempotencyKey
        ]
      );

      if (priorResult.rowCount) {
        await client.query('COMMIT');

        return {
          ...toPublicRow(priorResult.rows[0]),
          existing: true
        };
      }

      const availableBalance = BigInt(
        walletResult.rows[0].available_balance_kobo
      );

      if (availableBalance < BigInt(amountKobo)) {
        const error = new Error(
          'Insufficient available wallet balance.'
        );

        error.statusCode = 409;
        throw error;
      }

      // Reserve the balance in the same database transaction.
      await client.query(
        `UPDATE skydrop_wallets
         SET available_balance_kobo =
               available_balance_kobo - $2,
             updated_at = NOW()
         WHERE user_id = $1`,
        [
          input.userId,
          amountKobo
        ]
      );

      const insertResult = await client.query(
        `INSERT INTO skydrop_withdrawals (
           user_id,
           amount_kobo,
           currency,
           reference,
           idempotency_key,
           destination_bank_code,
           destination_account_number,
           destination_account_name,
           status
         )
         VALUES ($1, $2, 'NGN', $3, $4, $5, $6, $7, 'RESERVED')
         RETURNING *`,
        [
          input.userId,
          amountKobo,
          input.reference,
          input.idempotencyKey,
          input.destinationBankCode,
          input.destinationAccountNumber,
          input.destinationAccountName
        ]
      );

      await client.query('COMMIT');

      return toPublicRow(
        insertResult.rows[0]
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSubmission(id, details) {
    const result = await this.db.query(
      `UPDATE skydrop_withdrawals
       SET status = $2,
           provider_reference =
             COALESCE($3, provider_reference),
           provider_status = $4,
           submitted_at =
             COALESCE($5::timestamptz, submitted_at),
           failure_code = $6,
           failure_message = $7,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        details.status,
        details.providerReference || null,
        details.providerStatus || null,
        details.submittedAt || null,
        details.failureCode || null,
        details.failureMessage || null
      ]
    );

    if (!result.rowCount) {
      throw new Error(
        'Withdrawal record was not found while saving provider response.'
      );
    }

    return toPublicRow(result.rows[0]);
  }

  async findByReference(reference) {
    const result = await this.db.query(
      `SELECT *
       FROM skydrop_withdrawals
       WHERE reference = $1
       LIMIT 1`,
      [reference]
    );

    return toPublicRow(result.rows[0]);
  }

  async findByProviderReference(reference) {
    const result = await this.db.query(
      `SELECT *
       FROM skydrop_withdrawals
       WHERE provider_reference = $1
          OR reference = $1
       LIMIT 1`,
      [reference]
    );

    return toPublicRow(result.rows[0]);
  }

  async settleProviderStatus(
    id,
    requestedStatus,
    details = {}
  ) {
    const allowedStatuses = new Set([
      'PENDING',
      'PENDING_AUTHORIZATION',
      'UNKNOWN',
      'SUCCEEDED',
      'FAILED',
      'REVERSED'
    ]);

    const status = allowedStatuses.has(
      requestedStatus
    )
      ? requestedStatus
      : 'PENDING';

    const terminalStatuses = new Set([
      'SUCCEEDED',
      'FAILED',
      'REVERSED'
    ]);

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT *
         FROM skydrop_withdrawals
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (!result.rowCount) {
        throw new Error(
          'Withdrawal record not found during reconciliation.'
        );
      }

      const old = result.rows[0];

      const oldIsTerminal = terminalStatuses.has(
        old.status
      );

      // Do not overwrite an established terminal result with a stale event.
      // A later REVERSED status is allowed so the refund can be applied once.
      if (
        oldIsTerminal &&
        !(
          status === 'REVERSED' &&
          old.status !== 'REVERSED'
        )
      ) {
        await client.query('COMMIT');
        return toPublicRow(old);
      }

      const isTerminal = terminalStatuses.has(
        status
      );

      const needsRefund =
        (
          status === 'FAILED' ||
          status === 'REVERSED'
        ) &&
        !old.refund_applied_at;

      if (needsRefund) {
        const refundResult = await client.query(
          `UPDATE skydrop_wallets
           SET available_balance_kobo =
                 available_balance_kobo + $2,
               updated_at = NOW()
           WHERE user_id = $1`,
          [
            old.user_id,
            old.amount_kobo
          ]
        );

        if (!refundResult.rowCount) {
          throw new Error(
            'Cannot refund withdrawal: SkyDrop wallet was not found.'
          );
        }
      }

      const updateResult = await client.query(
        `UPDATE skydrop_withdrawals
         SET status = $2,
             provider_status = $3,
             provider_reference =
               COALESCE($4, provider_reference),
             provider_details = $5::jsonb,
             settled_at =
               CASE WHEN $6 THEN NOW() ELSE settled_at END,
             refund_applied_at =
               CASE WHEN $7 THEN NOW() ELSE refund_applied_at END,
             failure_code =
               COALESCE($8, failure_code),
             failure_message =
               COALESCE($9, failure_message),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          status,
          details.providerStatus || status,
          details.providerReference || null,
          JSON.stringify({
            checkedAt:
              details.checkedAt ||
              new Date().toISOString()
          }),
          isTerminal,
          needsRefund,
          details.failureCode || null,
          details.failureMessage || null
        ]
      );

      await client.query('COMMIT');

      return toPublicRow(
        updateResult.rows[0]
      );
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async listReconciliationCandidates(limit = 50) {
    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      200
    );

    const result = await this.db.query(
      `SELECT *
       FROM skydrop_withdrawals
       WHERE status IN (
         'PENDING',
         'PENDING_AUTHORIZATION',
         'UNKNOWN'
       )
       AND (
         provider_reference IS NOT NULL
         OR reference IS NOT NULL
       )
       ORDER BY created_at ASC
       LIMIT $1`,
      [safeLimit]
    );

    return result.rows.map(toPublicRow);
  }
}

module.exports = {
  WithdrawalRepository
};
