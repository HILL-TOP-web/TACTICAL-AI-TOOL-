'use strict';

const {
    validateAmount,
    validateCurrency,
    validateTransactionType
} = require('./TransactionValidator');

const DEFAULT_LIMITS = {
    NGN: {
        deposit: {
            min: '1',
            max: '1000000000'
        },
        withdrawal: {
            min: '100',
            max: null
        },
        transfer: {
            min: '1',
            max: null
        }
    },

    USD: {
        deposit: {
            min: '0.01',
            max: '1000000000'
        },
        withdrawal: {
            min: '0.01',
            max: null
        },
        transfer: {
            min: '0.01',
            max: null
        }
    },

    SKD: {
        deposit: {
            min: '0.00000001',
            max: null
        },
        withdrawal: {
            min: '0.00000001',
            max: null
        },
        transfer: {
            min: '0.00000001',
            max: null
        }
    },

    USDT: {
        deposit: {
            min: '0.000001',
            max: null
        },
        withdrawal: {
            min: '0.000001',
            max: null
        },
        transfer: {
            min: '0.000001',
            max: null
        }
    }
};

class TransactionLimitError extends Error {
    constructor(message, code = 'TRANSACTION_LIMIT_EXCEEDED') {
        super(message);

        this.name = 'TransactionLimitError';
        this.code = code;
        this.statusCode = 400;
    }
}

function compare(left, right) {
    const {
        compareDecimals
    } = require('./BalanceValidator');

    return compareDecimals(left, right);
}

class TransactionLimits {
    constructor({
        overrides = {},
        riskService = null
    } = {}) {
        this.overrides = overrides;
        this.riskService = riskService;
    }

    getLimits(currency, type) {
        const configuredCurrency = this.overrides[currency] || {};
        const configuredType = configuredCurrency[type];

        if (configuredType) {
            return {
                ...DEFAULT_LIMITS[currency]?.[type],
                ...configuredType
            };
        }

        return DEFAULT_LIMITS[currency]?.[type] || null;
    }

    async validate({
        userId,
        currency,
        type,
        amount,
        metadata = {}
    }) {
        const normalizedCurrency = validateCurrency(currency);
        const normalizedType = validateTransactionType(type);
        const normalizedAmount = validateAmount(amount);

        const limits = this.getLimits(
            normalizedCurrency,
            normalizedType
        );

        if (!limits) {
            throw new TransactionLimitError(
                'No transaction limits are configured for this operation.',
                'LIMIT_CONFIGURATION_MISSING'
            );
        }

        if (compare(normalizedAmount, limits.min) < 0) {
            throw new TransactionLimitError(
                `The minimum permitted amount is ${limits.min} ${normalizedCurrency}.`,
                'TRANSACTION_BELOW_MINIMUM'
            );
        }

        /*
         * A null maximum means no application-level maximum is
         * imposed by this configuration. Provider and regulatory
         * restrictions still apply.
         */
        if (
            limits.max !== null &&
            limits.max !== undefined &&
            compare(normalizedAmount, limits.max) > 0
        ) {
            throw new TransactionLimitError(
                'The transaction exceeds the configured maximum.',
                'TRANSACTION_ABOVE_MAXIMUM'
            );
        }

        if (this.riskService) {
            const assessment = await this.riskService.assess({
                userId: String(userId),
                currency: normalizedCurrency,
                type: normalizedType,
                amount: normalizedAmount,
                metadata
            });

            if (
                assessment &&
                assessment.allowed === false
            ) {
                throw new TransactionLimitError(
                    'The transaction was rejected by the risk controls.',
                    'RISK_CONTROL_REJECTED'
                );
            }

            if (
                assessment &&
                assessment.requiresReview === true
            ) {
                return {
                    allowed: false,
                    requiresReview: true,
                    currency: normalizedCurrency,
                    type: normalizedType,
                    amount: normalizedAmount
                };
            }
        }

        return {
            allowed: true,
            requiresReview: false,
            currency: normalizedCurrency,
            type: normalizedType,
            amount: normalizedAmount
        };
    }
}

module.exports = {
    TransactionLimits,
    TransactionLimitError,
    DEFAULT_LIMITS
};
