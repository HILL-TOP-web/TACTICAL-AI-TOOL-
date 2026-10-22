'use strict';

const TASK_TYPES = Object.freeze([
  'social_follow',
  'social_share',
  'profile_completion',
  'daily_check_in',
  'content_creation',
  'referral',
  'educational',
  'promotional',
  'custom'
]);

const TASK_STATUSES = Object.freeze([
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

const COMPLETION_STATUSES = Object.freeze([
  'pending',
  'under_review',
  'approved',
  'rejected'
]);

const REWARD_TYPES = Object.freeze([
  'none',
  'skd',
  'cash',
  'promotional'
]);

class TaskValidationError extends Error {
  constructor(message, code = 'TASK_VALIDATION_ERROR') {
    super(message);
    this.name = 'TaskValidationError';
    this.code = code;
  }
}

function requireText(value, field, maxLength = 500) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TaskValidationError(
      `${field} is required.`,
      'INVALID_TASK_FIELD'
    );
  }

  const result = value.trim();

  if (result.length > maxLength) {
    throw new TaskValidationError(
      `${field} must not exceed ${maxLength} characters.`,
      'TASK_FIELD_TOO_LONG'
    );
  }

  return result;
}

function requirePositiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TaskValidationError(
      `${field} must be a positive integer.`,
      'INVALID_TASK_NUMBER'
    );
  }

  return value;
}

function validateReward(reward = {}) {
  if (
    !reward ||
    typeof reward !== 'object' ||
    Array.isArray(reward)
  ) {
    throw new TaskValidationError(
      'Reward must be an object.',
      'INVALID_TASK_REWARD'
    );
  }

  const type = reward.type || 'none';

  if (!REWARD_TYPES.includes(type)) {
    throw new TaskValidationError(
      'Unsupported reward type.',
      'INVALID_REWARD_TYPE'
    );
  }

  if (type === 'none') {
    return Object.freeze({
      type: 'none',
      amount: 0,
      currency: null
    });
  }

  if (type === 'skd') {
    const amount = Number(reward.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(amount * 100000000)
    ) {
      throw new TaskValidationError(
        'SKD reward must be positive and support at most 8 decimal places.',
        'INVALID_SKD_REWARD'
      );
    }

    return Object.freeze({
      type: 'skd',
      amount,
      currency: 'SKD'
    });
  }

  if (type === 'cash') {
    const amount = Number(reward.amount);
    const currency = String(
      reward.currency || ''
    ).toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new TaskValidationError(
        'Cash reward amount must be greater than zero.',
        'INVALID_CASH_REWARD'
      );
    }

    if (!['NGN', 'USD'].includes(currency)) {
      throw new TaskValidationError(
        'Cash reward currency must be NGN or USD.',
        'INVALID_REWARD_CURRENCY'
      );
    }

    return Object.freeze({
      type: 'cash',
      amount,
      currency
    });
  }

  if (type === 'promotional') {
    return Object.freeze({
      type: 'promotional',
      amount: 0,
      currency: null
    });
  }

  throw new TaskValidationError(
    'Unsupported reward configuration.',
    'INVALID_TASK_REWARD'
  );
}

function validateCreateTask(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    throw new TaskValidationError(
      'Task details are required.',
      'INVALID_TASK_INPUT'
    );
  }

  const title = requireText(input.title, 'title', 120);

  const description = requireText(
    input.description,
    'description',
    3000
  );

  const type = requireText(input.type, 'type', 50);

  if (!TASK_TYPES.includes(type)) {
    throw new TaskValidationError(
      'Unsupported task type.',
      'INVALID_TASK_TYPE'
    );
  }

  const reward = validateReward(input.reward);

  const maxCompletions =
    input.maxCompletions === undefined ||
    input.maxCompletions === null
      ? null
      : requirePositiveInteger(
          input.maxCompletions,
          'maxCompletions'
        );

  const perUserLimit =
    input.perUserLimit === undefined
      ? 1
      : requirePositiveInteger(
          input.perUserLimit,
          'perUserLimit'
        );

  if (
    maxCompletions !== null &&
    maxCompletions < perUserLimit
  ) {
    throw new TaskValidationError(
      'maxCompletions cannot be less than perUserLimit.',
      'INVALID_TASK_LIMIT'
    );
  }

  let startsAt = null;
  let endsAt = null;

  if (input.startsAt != null) {
    startsAt = new Date(input.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      throw new TaskValidationError(
        'startsAt must be a valid date.',
        'INVALID_TASK_DATE'
      );
    }
  }

  if (input.endsAt != null) {
    endsAt = new Date(input.endsAt);

    if (Number.isNaN(endsAt.getTime())) {
      throw new TaskValidationError(
        'endsAt must be a valid date.',
        'INVALID_TASK_DATE'
      );
    }
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new TaskValidationError(
      'endsAt must be later than startsAt.',
      'INVALID_TASK_DATE_RANGE'
    );
  }

  return Object.freeze({
    title,
    description,
    type,
    reward,
    maxCompletions,
    perUserLimit,
    startsAt,
    endsAt,
    status: 'draft',
    requiresEvidence: Boolean(input.requiresEvidence)
  });
}

function validateCompletion(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    throw new TaskValidationError(
      'Completion details are required.',
      'INVALID_COMPLETION_INPUT'
    );
  }

  const taskId = requireText(input.taskId, 'taskId', 100);
  const userId = requireText(input.userId, 'userId', 100);

  let evidence = null;

  if (input.evidence != null) {
    evidence = requireText(
      input.evidence,
      'evidence',
      2000
    );
  }

  return Object.freeze({
    taskId,
    userId,
    evidence
  });
}

function validateTaskStatus(status) {
  if (!TASK_STATUSES.includes(status)) {
    throw new TaskValidationError(
      'Invalid task status.',
      'INVALID_TASK_STATUS'
    );
  }

  return status;
}

function validateCompletionStatus(status) {
  if (!COMPLETION_STATUSES.includes(status)) {
    throw new TaskValidationError(
      'Invalid completion status.',
      'INVALID_COMPLETION_STATUS'
    );
  }

  return status;
}

function validatePagination(input = {}) {
  const limit = Number(input.limit ?? 20);
  const offset = Number(input.offset ?? 0);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new TaskValidationError(
      'limit must be an integer between 1 and 100.',
      'INVALID_PAGINATION'
    );
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new TaskValidationError(
      'offset must be a non-negative integer.',
      'INVALID_PAGINATION'
    );
  }

  return { limit, offset };
}

module.exports = {
  TASK_TYPES,
  TASK_STATUSES,
  COMPLETION_STATUSES,
  REWARD_TYPES,
  TaskValidationError,
  validateReward,
  validateCreateTask,
  validateCompletion,
  validateTaskStatus,
  validateCompletionStatus,
  validatePagination
};
