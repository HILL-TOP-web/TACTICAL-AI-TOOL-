'use strict';

const crypto = require('node:crypto');

const {
  validateCreateTask,
  validateCompletion,
  validateTaskStatus,
  validateCompletionStatus,
  validatePagination
} = require('./TaskValidator');

class TaskManagerError extends Error {
  constructor(message, code = 'TASK_MANAGER_ERROR') {
    super(message);
    this.name = 'TaskManagerError';
    this.code = code;
  }
}

class TaskManager {
  constructor(options = {}) {
    if (
      !options.db ||
      typeof options.db.query !== 'function'
    ) {
      throw new TaskManagerError(
        'A PostgreSQL-compatible database client is required.',
        'DATABASE_CLIENT_REQUIRED'
      );
    }

    this.db = options.db;
    this.authorization = options.authorization || null;
    this.rewardService = options.rewardService || null;
    this.audit = options.audit || null;
  }

  checkEnvironment(options = {}) {
    const required = ['DATABASE_URL'];

    if (options.requireMonnify === true) {
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

  async assertUser(user) {
    if (
      !user ||
      typeof user.id !== 'string' ||
      !user.id.trim()
    ) {
      throw new TaskManagerError(
        'An authenticated user is required.',
        'AUTHENTICATION_REQUIRED'
      );
    }

    if (
      this.authorization &&
      typeof this.authorization.requireUserIdentity === 'function'
    ) {
      await this.authorization.requireUserIdentity(user);
    }

    return user;
  }

  async writeAudit(event, details = {}) {
    if (
      this.audit &&
      typeof this.audit.record === 'function'
    ) {
      await this.audit.record({
        event,
        details,
        occurredAt: new Date().toISOString()
      });
    }
  }

  async createTask(input, actor) {
    await this.assertUser(actor);

    if (
      !this.authorization ||
      typeof this.authorization.requirePermission !== 'function'
    ) {
      throw new TaskManagerError(
        'Task-creation authorization is not configured.',
        'TASK_AUTHORIZATION_REQUIRED'
      );
    }

    await this.authorization.requirePermission(
      actor,
      'tasks:create'
    );

    const task = validateCreateTask(input);
    const id = crypto.randomUUID();

    const result = await this.db.query(
      `INSERT INTO skydrop_tasks (
         id,
         title,
         description,
         type,
         reward_type,
         reward_amount,
         reward_currency,
         max_completions,
         per_user_limit,
         starts_at,
         ends_at,
         status,
         requires_evidence,
         created_by,
         created_at,
         updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13, $14,
         NOW(), NOW()
       )
       RETURNING *`,
      [
        id,
        task.title,
        task.description,
        task.type,
        task.reward.type,
        task.reward.amount,
        task.reward.currency,
        task.maxCompletions,
        task.perUserLimit,
        task.startsAt,
        task.endsAt,
        task.status,
        task.requiresEvidence,
        actor.id
      ]
    );

    await this.writeAudit('task.created', {
      taskId: id,
      actorId: actor.id
    });

    return this.formatTask(result.rows[0]);
  }

  async getTask(taskId) {
    if (
      typeof taskId !== 'string' ||
      !taskId.trim()
    ) {
      throw new TaskManagerError(
        'taskId is required.',
        'INVALID_TASK_ID'
      );
    }

    const result = await this.db.query(
      `SELECT *
       FROM skydrop_tasks
       WHERE id = $1
       LIMIT 1`,
      [taskId]
    );

    return result.rows[0]
      ? this.formatTask(result.rows[0])
      : null;
  }

  async listTasks(filters = {}) {
    const { limit, offset } = validatePagination(filters);
    const values = [];
    const conditions = [];

    if (filters.status) {
      validateTaskStatus(filters.status);
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`type = $${values.length}`);
    }

    if (filters.availableOnly === true) {
      conditions.push(`status = 'active'`);
      conditions.push('(starts_at IS NULL OR starts_at <= NOW())');
      conditions.push('(ends_at IS NULL OR ends_at > NOW())');
    }

    values.push(limit);
    const limitPosition = values.length;

    values.push(offset);
    const offsetPosition = values.length;

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await this.db.query(
      `SELECT *
       FROM skydrop_tasks
       ${where}
       ORDER BY created_at DESC
       LIMIT $${limitPosition}
       OFFSET $${offsetPosition}`,
      values
    );

    return result.rows.map((row) => this.formatTask(row));
  }

  async setTaskStatus(taskId, status, actor) {
    await this.assertUser(actor);
    validateTaskStatus(status);

    if (
      !this.authorization ||
      typeof this.authorization.requirePermission !== 'function'
    ) {
      throw new TaskManagerError(
        'Task-management authorization is not configured.',
        'TASK_AUTHORIZATION_REQUIRED'
      );
    }

    await this.authorization.requirePermission(
      actor,
      'tasks:manage'
    );

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      throw new TaskManagerError(
        'Only active, paused, or cancelled statuses are allowed.',
        'TASK_STATUS_CHANGE_NOT_ALLOWED'
      );
    }

    const result = await this.db.query(
      `UPDATE skydrop_tasks
       SET status = $2, updated_at = NOW()
       WHERE id = $1
         AND status <> 'completed'
       RETURNING *`,
      [taskId, status]
    );

    if (!result.rows[0]) {
      throw new TaskManagerError(
        'Task not found or cannot change status.',
        'TASK_NOT_FOUND_OR_LOCKED'
      );
    }

    await this.writeAudit('task.status_changed', {
      taskId,
      status,
      actorId: actor.id
    });

    return this.formatTask(result.rows[0]);
  }

  async submitCompletion(input, actor) {
    await this.assertUser(actor);

    const completion = validateCompletion(input);

    if (completion.userId !== actor.id) {
      throw new TaskManagerError(
        'You cannot submit a task for another user.',
        'TASK_USER_MISMATCH'
      );
    }

    const task = await this.getTask(completion.taskId);

    if (!task) {
      throw new TaskManagerError(
        'Task not found.',
        'TASK_NOT_FOUND'
      );
    }

    if (task.status !== 'active') {
      throw new TaskManagerError(
        'This task is not active.',
        'TASK_NOT_ACTIVE'
      );
    }

    const now = Date.now();

    if (
      task.startsAt &&
      now < new Date(task.startsAt).getTime()
    ) {
      throw new TaskManagerError(
        'This task has not started yet.',
        'TASK_NOT_STARTED'
      );
    }

    if (
      task.endsAt &&
      now >= new Date(task.endsAt).getTime()
    ) {
      throw new TaskManagerError(
        'This task has expired.',
        'TASK_EXPIRED'
      );
    }

    if (task.requiresEvidence && !completion.evidence) {
      throw new TaskManagerError(
        'Evidence is required for this task.',
        'TASK_EVIDENCE_REQUIRED'
      );
    }

    const id = crypto.randomUUID();

    try {
      const result = await this.db.query(
        `INSERT INTO skydrop_task_completions (
           id,
           task_id,
           user_id,
           evidence,
           status,
           idempotency_key,
           created_at,
           updated_at
         )
         VALUES ($1, $2, $3, $4, 'pending', $5, NOW(), NOW())
         RETURNING *`,
        [
          id,
          completion.taskId,
          actor.id,
          completion.evidence,
          crypto.randomUUID()
        ]
      );

      await this.writeAudit('task.completion_submitted', {
        completionId: id,
        taskId: completion.taskId,
        actorId: actor.id
      });

      return this.formatCompletion(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        throw new TaskManagerError(
          'A completion already exists or violates a task limit.',
          'DUPLICATE_TASK_COMPLETION'
        );
      }

      throw error;
    }
  }

  async listCompletions(taskId, filters = {}, actor) {
    await this.assertUser(actor);

    if (
      !this.authorization ||
      typeof this.authorization.requirePermission !== 'function'
    ) {
      throw new TaskManagerError(
        'Completion-list authorization is not configured.',
        'TASK_AUTHORIZATION_REQUIRED'
      );
    }

    await this.authorization.requirePermission(
      actor,
      'tasks:review'
    );

    const { limit, offset } = validatePagination(filters);
    const values = [taskId];
    const conditions = ['task_id = $1'];

    if (filters.status) {
      validateCompletionStatus(filters.status);
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }

    if (filters.userId) {
      values.push(filters.userId);
      conditions.push(`user_id = $${values.length}`);
    }

    values.push(limit);
    const limitPosition = values.length;

    values.push(offset);
    const offsetPosition = values.length;

    const result = await this.db.query(
      `SELECT *
       FROM skydrop_task_completions
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${limitPosition}
       OFFSET $${offsetPosition}`,
      values
    );

    return result.rows.map((row) => this.formatCompletion(row));
  }

  async reviewCompletion(
    completionId,
    status,
    reviewer,
    reviewNote = null
  ) {
    await this.assertUser(reviewer);
    validateCompletionStatus(status);

    if (!['approved', 'rejected'].includes(status)) {
      throw new TaskManagerError(
        'Review status must be approved or rejected.',
        'INVALID_REVIEW_DECISION'
      );
    }

    if (
      !this.authorization ||
      typeof this.authorization.requirePermission !== 'function'
    ) {
      throw new TaskManagerError(
        'Task-review authorization is not configured.',
        'TASK_REVIEW_AUTHORIZATION_REQUIRED'
      );
    }

    await this.authorization.requirePermission(
      reviewer,
      'tasks:review'
    );

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const completionResult = await client.query(
        `SELECT *
         FROM skydrop_task_completions
         WHERE id = $1
         FOR UPDATE`,
        [completionId]
      );

      const completion = completionResult.rows[0];

      if (!completion) {
        throw new TaskManagerError(
          'Completion not found.',
          'COMPLETION_NOT_FOUND'
        );
      }

      if (
        completion.status === 'approved' ||
        completion.status === 'rejected'
      ) {
        throw new TaskManagerError(
          'This completion has already been reviewed.',
          'COMPLETION_ALREADY_REVIEWED'
        );
      }

      const taskResult = await client.query(
        `SELECT *
         FROM skydrop_tasks
         WHERE id = $1
         FOR UPDATE`,
        [completion.task_id]
      );

      const task = taskResult.rows[0];

      if (!task) {
        throw new TaskManagerError(
          'Associated task not found.',
          'TASK_NOT_FOUND'
        );
      }

      const updateResult = await client.query(
        `UPDATE skydrop_task_completions
         SET status = $2,
             reviewed_by = $3,
             review_note = $4,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          completionId,
          status,
          reviewer.id,
          typeof reviewNote === 'string'
            ? reviewNote.slice(0, 1000)
            : null
        ]
      );

      await client.query('COMMIT');

      await this.writeAudit('task.completion_reviewed', {
        completionId,
        taskId: task.id,
        decision: status,
        reviewerId: reviewer.id
      });

      return {
        completion: this.formatCompletion(updateResult.rows[0]),
        reward: status === 'approved'
          ? {
              type: task.reward_type,
              amount: Number(task.reward_amount || 0),
              currency: task.reward_currency || null,
              paymentStatus: 'not_processed'
            }
          : null
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        // Preserve the original error.
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async processApprovedReward(completionId, actor) {
    await this.assertUser(actor);

    if (
      !this.authorization ||
      typeof this.authorization.requirePermission !== 'function'
    ) {
      throw new TaskManagerError(
        'Reward-processing authorization is not configured.',
        'REWARD_AUTHORIZATION_REQUIRED'
      );
    }

    await this.authorization.requirePermission(
      actor,
      'tasks:reward'
    );

    if (
      !this.rewardService ||
      typeof this.rewardService.processTaskReward !== 'function'
    ) {
      throw new TaskManagerError(
        'The existing reward service is not configured.',
        'REWARD_SERVICE_UNAVAILABLE'
      );
    }

    const result = await this.db.query(
      `SELECT
         c.id AS completion_id,
         c.task_id,
         c.user_id,
         c.status AS completion_status,
         t.reward_type,
         t.reward_amount,
         t.reward_currency
       FROM skydrop_task_completions c
       JOIN skydrop_tasks t ON t.id = c.task_id
       WHERE c.id = $1
       LIMIT 1`,
      [completionId]
    );

    const row = result.rows[0];

    if (!row) {
      throw new TaskManagerError(
        'Completion not found.',
        'COMPLETION_NOT_FOUND'
      );
    }

    if (row.completion_status !== 'approved') {
      throw new TaskManagerError(
        'Only approved completions can receive rewards.',
        'COMPLETION_NOT_APPROVED'
      );
    }

    if (row.reward_type === 'cash') {
      const envCheck = this.checkEnvironment({
        requireMonnify: true
      });

      if (!envCheck.ok) {
        throw new TaskManagerError(
          `Required backend configuration is missing: ${envCheck.missing.join(', ')}`,
          'PAYMENT_CONFIGURATION_MISSING'
        );
      }

      throw new TaskManagerError(
        'Cash rewards must use the authorized withdrawal and Monnify disbursement workflow.',
        'CASH_REWARD_REQUIRES_PAYOUT_WORKFLOW'
      );
    }

    if (row.reward_type === 'none') {
      return {
        completionId,
        status: 'no_reward_required'
      };
    }

    return this.rewardService.processTaskReward({
      completionId: row.completion_id,
      taskId: row.task_id,
      userId: row.user_id,
      reward: {
        type: row.reward_type,
        amount: Number(row.reward_amount || 0),
        currency: row.reward_currency || null
      },
      idempotencyKey: `task-reward:${row.completion_id}`
    });
  }

  formatTask(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      reward: {
        type: row.reward_type,
        amount: Number(row.reward_amount || 0),
        currency: row.reward_currency || null
      },
      maxCompletions: row.max_completions == null
        ? null
        : Number(row.max_completions),
      perUserLimit: Number(row.per_user_limit),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      requiresEvidence: Boolean(row.requires_evidence),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  formatCompletion(row) {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      evidence: row.evidence,
      status: row.status,
      reviewedBy: row.reviewed_by || null,
      reviewNote: row.review_note || null,
      reviewedAt: row.reviewed_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = {
  TaskManager,
  TaskManagerError
};
