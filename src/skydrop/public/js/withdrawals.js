'use strict';

(function () {
    const API = window.SkyDropAPI;

    if (!API) {
        throw new Error('Load api.js before withdrawals.js.');
    }

    const MIN_WITHDRAWAL_NGN = 100;

    function element(id) {
        return document.getElementById(id);
    }

    function setMessage(message, isError = false) {
        const output = element('withdrawal-status');

        if (output) {
            output.textContent = message;
            output.dataset.state = isError ? 'error' : 'success';
        }
    }

    function readWithdrawalForm() {
        const accountNumber =
            element('withdrawal-account-number')?.value.trim();

        const bankCode =
            element('withdrawal-bank-code')?.value.trim();

        const accountName =
            element('withdrawal-account-name')?.value.trim();

        const amount = Number(
            element('withdrawal-amount')?.value
        );

        if (!accountNumber) {
            throw new Error('Enter the recipient account number.');
        }

        if (!/^\d{10}$/.test(accountNumber)) {
            throw new Error('Enter a valid 10-digit Nigerian bank account number.');
        }

        if (!bankCode) {
            throw new Error('Select or enter the recipient bank code.');
        }

        if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_NGN) {
            throw new Error(
                `The minimum withdrawal amount is ₦${MIN_WITHDRAWAL_NGN}.`
            );
        }

        return {
            amount,
            currency: 'NGN',
            recipient: {
                accountNumber,
                bankCode,
                accountName: accountName || undefined
            }
        };
    }

    async function submitWithdrawal(event) {
        event?.preventDefault();

        const submitButton = element('submit-withdrawal');

        try {
            const withdrawal = readWithdrawalForm();

            const confirmed = window.confirm(
                `Request a withdrawal of ₦${withdrawal.amount.toLocaleString()} ` +
                `to account ${withdrawal.recipient.accountNumber}?`
            );

            if (!confirmed) {
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
            }

            setMessage('Submitting withdrawal request...');

            const response = await API.post(
                '/api/withdrawals',
                withdrawal
            );

            const result = response?.data ?? response;

            const status = result?.status || 'pending';

            const reference =
                result?.reference ||
                result?.transactionReference ||
                'Not provided';

            setMessage(
                `Withdrawal request received. Status: ${status}. ` +
                `Reference: ${reference}.`
            );

            await loadWithdrawals().catch(() => {});

            if (window.SkyDropDashboard) {
                window.SkyDropDashboard.refresh().catch(() => {});
            }
        } catch (error) {
            setMessage(error.message, true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    async function loadWithdrawals() {
        const output = element('withdrawals-list');

        try {
            const response = await API.get('/api/withdrawals');

            const result = response?.data ?? response;

            const withdrawals = Array.isArray(result)
                ? result
                : result?.withdrawals;

            if (!Array.isArray(withdrawals)) {
                throw new Error('The withdrawal endpoint returned invalid data.');
            }

            if (!output) {
                return withdrawals;
            }

            output.replaceChildren();

            if (withdrawals.length === 0) {
                output.textContent = 'No withdrawals found.';
                return withdrawals;
            }

            for (const withdrawal of withdrawals) {
                const item = document.createElement('li');

                const amount = Number(withdrawal.amount);
                const safeAmount = Number.isFinite(amount)
                    ? amount
                    : 0;

                const reference =
                    withdrawal.reference ||
                    withdrawal.transactionReference ||
                    'No reference';

                item.textContent =
                    `₦${safeAmount.toLocaleString()} — ` +
                    `${withdrawal.status || 'Unknown'} — ${reference}`;

                output.appendChild(item);
            }

            return withdrawals;
        } catch (error) {
            if (output) {
                output.textContent = error.message;
            }

            throw error;
        }
    }

    window.SkyDropWithdrawals = Object.freeze({
        submitWithdrawal,
        loadWithdrawals
    });

    document.addEventListener('DOMContentLoaded', () => {
        element('withdrawal-form')?.addEventListener(
            'submit',
            submitWithdrawal
        );

        element('refresh-withdrawals')?.addEventListener('click', () => {
            loadWithdrawals().catch(() => {});
        });
    });
})();
