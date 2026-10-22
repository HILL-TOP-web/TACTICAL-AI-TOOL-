'use strict';

const KYC_STATUSES = Object.freeze({
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  RESUBMISSION_REQUIRED: 'resubmission_required'
});

const DOCUMENT_TYPES = Object.freeze([
  'national_id',
  'passport',
  'drivers_license',
  'voters_card',
  'residence_permit'
]);

const ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'application/pdf'
]);

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateName(value, fieldName) {
  const name = cleanString(value);

  if (!name) {
    return `${fieldName}_REQUIRED`;
  }

  if (name.length < 2 || name.length > 100) {
    return `${fieldName}_INVALID_LENGTH`;
  }

  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return `${fieldName}_CONTAINS_INVALID_CHARACTERS`;
  }

  return null;
}

function validateEmail(value) {
  const email = cleanString(value).toLowerCase();

  if (!email) {
    return 'EMAIL_REQUIRED';
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return 'EMAIL_INVALID';
  }

  return null;
}

function validateDateOfBirth(value) {
  const date = cleanString(value);

  if (!date) {
    return 'DATE_OF_BIRTH_REQUIRED';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'DATE_OF_BIRTH_MUST_USE_YYYY_MM_DD';
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return 'DATE_OF_BIRTH_INVALID';
  }

  if (parsed.get
