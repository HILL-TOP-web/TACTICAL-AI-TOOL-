'use strict';

const {
  KycService
} = require('./KycService');

const {
  KYC_STATUSES,
  DOCUMENT_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateName,
  validateEmail,
  validateDateOfBirth,
  validateCountry,
  validateDocumentType,
  validateDocumentMetadata,
  validateKycSubmission,
  validateReview
} = require('./KycValidator');

module.exports = {
  KycService,
  KYC_STATUSES,
  DOCUMENT_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateName,
  validateEmail,
  validateDateOfBirth,
  validateCountry,
  validateDocumentType,
  validateDocumentMetadata,
  validateKycSubmission,
  validateReview
};
