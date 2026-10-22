'use strict';

const validator = require('./TaskValidator');

const {
  TaskManager,
  TaskManagerError
} = require('./TaskManager');

module.exports = {
  TaskManager,
  TaskManagerError,

  TASK_TYPES: validator.TASK_TYPES,
  TASK_STATUSES: validator.TASK_STATUSES,
  COMPLETION_STATUSES: validator.COMPLETION_STATUSES,
  REWARD_TYPES: validator.REWARD_TYPES,

  TaskValidationError: validator.TaskValidationError,
  validateReward: validator.validateReward,
  validateCreateTask: validator.validateCreateTask,
  validateCompletion: validator.validateCompletion,
  validateTaskStatus: validator.validateTaskStatus,
  validateCompletionStatus: validator.validateCompletionStatus,
  validatePagination: validator.validatePagination
};
