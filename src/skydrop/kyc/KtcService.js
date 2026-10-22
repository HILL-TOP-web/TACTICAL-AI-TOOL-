'use strict';

const crypto = require('node:crypto');

const {
  KYC_STATUSES,
  validateKycSubmission,
  validateReview
} = require('./KycValidator');

class KycService {
  constructor(options = {}) {
    if (!options.db || typeof options.db.query !== 'function') {
      throw new Error('DATABASE_CONNECTION_REQUIRED');
    }

    this.db = options.db;
    this.authorization = options.authorization || null;
    this.audit = options.audit || null;

    /*
     * Optional identity-verification provider.
     * This is separate from Monnify payment-provider connectivity.
     */
    this.identityProvider = options.identityProvider || null;

    /*
     * Optional Monnify client for features that specifically require
     * Monnify account/provider verification.
     */
    this.monnifyClient = options.monnifyClient || null;
  }

  checkEnvironment(options = {}) {
    const required = ['DATABASE_URL'];

    if (options.requireMonnify) {
      required.push(
        'MONNIFY_BASE_URL',
        'MONNIFY_API_KEY',
        'MONNIFY_SECRET_KEY',
        'MONNIFY_CONTRACT_CODE'
      );
    }

    const missing = required.filter((name) => {
      return (
        typeof process.env[name] !== 'string' ||
        process.env[name].trim() === ''
      );
    });

    return {
      ok: missing.length === 0,
      missing
    };
  }

  async requirePermission(actor, permission) {
    if (!actor || !actor.id) {
      throw new Error('AUTHENTICATED_ACTOR_REQUIRED');
    }

    if (!this.authorization) {
      throw new Error('AUTHORIZATION_SERVICE_NOT_CONFIGURED');
    }

    if (
      typeof this.authorization.requirePermission === 'function'
    ) {
      await this.authorization.requirePermission(actor, permission);
      return;
    }

    if (
      typeof this.authorization.hasPermission === 'function'
    ) {
      const allowed = await this.authorization.hasPermission(
        actor,
        permission
      );

      if (!allowed) {
        throw new Error('FORBIDDEN');
      }

      return;
    }

    throw new Error('UNSUPPORTED_AUTHORIZATION_INTERFACE');
  }

  createReference() {
    return `KYC_${crypto.randomUUID()}`;
  }

  async submitKyc(userId, input) {
    if (!userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    const environment = this.checkEnvironment();

    if (!environment.ok) {
      const error = new Error('KYC_ENVIRONMENT_NOT_CONFIGURED');
      error.details = environment.missing;
      throw error;
    }

    const validation = validateKycSubmission(input);

    if (!validation.valid) {
      const error = new Error('KYC_VALIDATION_FAILED');
      error.code = 'KYC_VALIDATION_FAILED';
      error.details = validation.errors;
      throw error;
    }

    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `
          SELECT id, status
          FROM skydrop_kyc
          WHERE user_id = $1
          FOR UPDATE
        `,
        [String(userId)]
      );

      if (
        existing.rows.length > 0 &&
        [
          KYC_STATUSES.PENDING,
          KYC_STATUSES.UNDER_REVIEW,
          KYC_STATUSES.VERIFIED
        ].includes(existing.rows[0].status)
      ) {
        throw new Error('KYC_ALREADY_SUBMITTED_OR_VERIFIED');
      }

      const reference = this.createReference();
      const submission = validation.value;

      /*
       * Store personal information only in the restricted backend
       * database. Store documents in private object storage; never
       * store their raw bytes or public URLs in this JSON field.
       */
      const result = await client.query(
        `
          INSERT INTO skydrop_kyc (
            reference,
            user_id,
            first_name,
            last_name,
            email,
            date_of_birth,
            country,
            documents,
            status,
            privacy_consent,
            submitted_at,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, NOW(), NOW(), NOW()
          )
          ON CONFLICT (user_id)
          DO UPDATE SET
            reference = EXCLUDED.reference,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            date_of_birth = EXCLUDED.date_of_birth,
            country = EXCLUDED.country,
            documents = EXCLUDED.documents,
            status = EXCLUDED.status,
            privacy_consent = EXCLUDED.privacy_consent,
            review_reason = NULL,
            reviewed_by = NULL,
            reviewed_at = NULL,
            submitted_at = NOW(),
            updated_at = NOW()
          RETURNING *
        `,
        [
          reference,
          String(userId),
          submission.firstName,
          submission.lastName,
          submission.email,
          submission.dateOfBirth,
          submission.country,
          JSON.stringify(submission.documents),
          KYC_STATUSES.PENDING,
          true
        ]
      );

      await client.query('COMMIT');

      await this.writeAudit({
        actorId: String(userId),
        action: 'kyc.submitted',
        reference,
        metadata: {
          status: KYC_STATUSES.PENDING,
          documentCount: submission.documents.length
        }
      });

      return this.formatKyc(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      this.releaseClient(client);
    }
  }

  async getMyKyc(userId) {
    if (!userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    const result = await this.db.query(
      `
        SELECT
          reference,
          user_id,
          status,
          review_reason,
          submitted_at,
          reviewed_at,
          created_at,
          updated_at
        FROM skydrop_kyc
        WHERE user_id = $1
        LIMIT 1
      `,
      [String(userId)]
    );

    if (result.rows.length === 0) {
      return {
        userId: String(userId),
        status: KYC_STATUSES.NOT_STARTED
      };
    }

    /*
     * Do not expose identity document storage keys or sensitive
     * identity fields in the ordinary status response.
     */
    return this.formatPublicStatus(result.rows[0]);
  }

  async getKycForReview(reference, actor) {
    await this.requirePermission(actor, 'kyc:review');

    const result = await this.db.query(
      `
        SELECT *
        FROM skydrop_kyc
        WHERE reference = $1
        LIMIT 1
      `,
      [String(reference)]
    );

    if (result.rows.length === 0) {
      return null;
    }

    /*
     * This is a privileged review endpoint. Protect its caller with
     * authentication, authorization, access logging and rate limits.
     */
    return this.formatKyc(result.rows[0]);
  }

  async listPendingReviews(options = {}, actor) {
    await this.requirePermission(actor, 'kyc:review');

    const limit = this.normalizeLimit(options.limit);
    const offset = this.normalizeOffset(options.offset);

    const result = await this.db.query(
      `
        SELECT
          reference,
          user_id,
          status,
          country,
          submitted_at,
          created_at
        FROM skydrop_kyc
        WHERE status IN ($1, $2)
        ORDER BY submitted_at ASC
        LIMIT $3 OFFSET $4
      `,
      [
        KYC_STATUSES.PENDING,
        KYC_STATUSES.UNDER_REVIEW,
        limit,
        offset
      ]
    );

    return result.rows.map((row) => ({
      reference: row.reference,
      userId: row.user_id,
      status: row.status,
      country: row.country,
      submittedAt: row.submitted_at,
      createdAt: row.created_at
    }));
  }

  async reviewKyc(reference, input, actor) {
    await this.requirePermission(actor, 'kyc:review');

    const validation = validateReview(input);

    if (!validation.valid) {
      const error = new Error('KYC_REVIEW_VALIDATION_FAILED');
      error.details = validation.errors;
      throw error;
    }

    const review = validation.value;
    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      const current = await client.query(
        `
          SELECT *
          FROM skydrop_kyc
          WHERE reference = $1
          FOR UPDATE
        `,
        [String(reference)]
      );

      if (current.rows.length === 0) {
        throw new Error('KYC_RECORD_NOT_FOUND');
      }

      const record = current.rows[0];

      if (
        record.status === KYC_STATUSES.VERIFIED ||
        record.status === KYC_STATUSES.REJECTED
      ) {
        throw new Error('KYC_RECORD_ALREADY_FINALIZED');
      }

      const updated = await client.query(
        `
          UPDATE skydrop_kyc
          SET status = $1,
              review_reason = $2,
              reviewed_by = $3,
              reviewed_at = NOW(),
              updated_at = NOW()
          WHERE reference = $4
          RETURNING *
        `,
        [
          review.status,
          review.reason || null,
          String(actor.id),
          String(reference)
        ]
      );

      await client.query('COMMIT');

      await this.writeAudit({
        actorId: String(actor.id),
        action: 'kyc.reviewed',
        reference: String(reference),
        metadata: {
          status: review.status
        }
      });

      return this.formatPublicStatus(updated.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Optional identity-provider integration.
   *
   * This method requires a separately configured identity verification
   * provider. Monnify credentials alone are not an identity check.
   */
  async verifyIdentityWithProvider(reference, actor) {
    await this.requirePermission(actor, 'kyc:verify_identity');

    if (
      !this.identityProvider ||
      typeof this.identityProvider.verifyIdentity !== 'function'
    ) {
      throw new Error('IDENTITY_PROVIDER_NOT_CONFIGURED');
    }

    const result = await this.db.query(
      `
        SELECT *
        FROM skydrop_kyc
        WHERE reference = $1
        LIMIT 1
      `,
      [String(reference)]
    );

    if (result.rows.length === 0) {
      throw new Error('KYC_RECORD_NOT_FOUND');
    }

    const record = result.rows[0];

    if (
      ![
        KYC_STATUSES.PENDING,
        KYC_STATUSES.UNDER_REVIEW
      ].includes(record.status)
    ) {
      throw new Error('KYC_STATUS_NOT_ELIGIBLE_FOR_VERIFICATION');
    }

    /*
     * Use only the provider's documented API and a securely configured
     * server-side client. Do not log identity numbers or documents.
     */
    const providerResult =
      await this.identityProvider.verifyIdentity({
        reference: record.reference,
        firstName: record.first_name,
        lastName: record.last_name,
        dateOfBirth: record.date_of_birth,
        country: record.country
      });

    await this.writeAudit({
      actorId: String(actor.id),
      action: 'kyc.identity_provider_check',
      reference: String(reference),
      metadata: {
        provider: 'configured_identity_provider',
        result: providerResult && providerResult.status
          ? String(providerResult.status)
          : 'unknown'
      }
    });

    /*
     * Provider result is recorded as an outcome for the reviewer.
     * It does not automatically mark the account verified.
     */
    return {
      reference: record.reference,
      providerStatus: providerResult && providerResult.status
        ? String(providerResult.status)
        : 'unknown',
      requiresAuthorizedReview: true
    };
  }

  /**
   * Optional Monnify configuration and connectivity checks.
   *
   * The actual API call depends on the Monnify client interface
   * implemented in your existing banking integration.
   */
  async checkMonnifyConnection() {
    const environment = this.checkEnvironment({
      requireMonnify: true
    });

    if (!environment.ok) {
      return {
        configured: false,
        connected: false,
        missing: environment.missing
      };
    }

    if (
      !this.monnifyClient ||
      typeof this.monnifyClient.healthCheck !== 'function'
    ) {
      return {
        configured: true,
        connected: false,
        reason: 'MONNIFY_HEALTH_CHECK_NOT_IMPLEMENTED'
      };
    }

    try {
      const result = await this.monnifyClient.healthCheck();

      return {
        configured: true,
        connected: Boolean(result && result.ok),
        reason: result && result.ok
          ? null
          : 'MONNIFY_CONNECTION_CHECK_FAILED'
      };
    } catch {
      /*
       * Do not return raw provider exceptions; they might contain
       * sensitive request or configuration details.
       */
      return {
        configured: true,
        connected: false,
        reason: 'MONNIFY_CONNECTION_CHECK_FAILED'
      };
    }
  }

  async writeAudit(entry) {
    if (!this.audit) {
      return;
    }

    const safeEntry = {
      actorId: entry.actorId,
      action: entry.action,
      reference: entry.reference,
      metadata: entry.metadata || {}
    };

    if (typeof this.audit.record === 'function') {
      await this.audit.record(safeEntry);
      return;
    }

    if (
      typeof this.audit.recordSecurityEvent === 'function'
    ) {
      await this.audit.recordSecurityEvent(safeEntry);
    }
  }

  async getClient() {
    if (typeof this.db.connect === 'function') {
      return this.db.connect();
    }

    /*
     * A standalone PostgreSQL client cannot provide an isolated
     * concurrent transaction safely through this helper.
     */
    throw new Error('DATABASE_POOL_CONNECTION_REQUIRED');
  }

  releaseClient(client) {
    if (client && typeof client.release === 'function') {
      client.release();
    }
  }

  normalizeLimit(value) {
    const number = Number(value ?? 50);

    if (!Number.isInteger(number) || number < 1) {
      return 50;
    }

    return Math.min(number, 100);
  }

  normalizeOffset(value) {
    const number = Number(value ?? 0);

    if (!Number.isInteger(number) || number < 0) {
      return 0;
    }

    return number;
  }

  formatPublicStatus(row) {
    return {
      reference: row.reference,
      userId: row.user_id,
      status: row.status,
      reviewReason: row.review_reason || null,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  formatKyc(row) {
    return {
      reference: row.reference,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      dateOfBirth: row.date_of_birth,
      country: row.country,
      documents: row.documents,
      status: row.status,
      reviewReason: row.review_reason || null,
      submittedAt: row.submitted_at,
      reviewedBy: row.reviewed_by || null,
      reviewedAt: row.reviewed_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = {
  KycService
};
