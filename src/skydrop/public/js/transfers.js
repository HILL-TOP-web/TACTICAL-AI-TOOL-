'use strict';

(function () {
    const API = window.SkyDropAPI;

    if (!API) {
        throw new Error('Load api.js before transfers.js.');
    }

    function element(id) {
        return document.getElementById(id);
    }

    function setMessage(message, isError = false) {
        const output = element('transfer-status');

        if (output) {
            output.textContent = message;
            output.dataset.state = isError ? 'error' : 'success';
        }
    }

    function readForm() {
        const recipient = element('transfer-recipient')?.value.trim();
        const amountInput = element('transfer-amount')?.value;
        const asset = element('transfer-asset')?.value;
        const amount = Number(amountInput);

        if (!recipient) {
            throw new Error('Enter the recipient account or wallet identifier.');
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Enter a valid transfer amount greater than zero.');
        }

        if (!['SKD', 'USD', 'NGN', 'USDT'].includes(asset)) {
            throw new Error('Select a supported asset.');
        }

        return {
            recipient,
            amount,
            asset
        };
    }

    async function submitTransfer(event) {
        event?.preventDefault();

        const submitButton = element('submit-transfer');

        try {
            const transfer = readForm();

            const confirmed = window.confirm(
                `Submit a transfer of ${transfer.amount} ${transfer.asset} ` +
                `to ${transfer.recipient}?`
            );

            if (!confirmed) {
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
            }

            setMessage('Submitting transfer request...');

            const response = await API.post(
                '/api/transfers',
                transfer
            );

            const result = response?.data ?? response;
            const status = result?.status || 'pending';
            const reference =
                result?.reference ||
                result?.transactionReference ||
                'Not provided';

            setMessage(
                `Transfer request received. Status: ${status}. Reference: ${reference}.`
            );

            await loadTransfers().catch(() => {});

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

    async function loadTransfers() {
        const output = element('transfers-list');

        try {
            const response = await API.get('/api/transfers');

            const result = response?.data ?? response;

            const transfers = Array.isArray(result)
                ? result
                : result?.transfers;

            if (!Array.isArray(transfers)) {
                throw new Error('The transfer endpoint returned invalid data.');
            }

            if (!output) {
                return transfers;
            }

            output.replaceChildren();

            if (transfers.length === 0) {
                output.textContent = 'No transfers found.';
                return transfers;
            }

            for (const transfer of transfers) {
                const item = document.createElement('li');

                const amount = Number(transfer.amount);
                const safeAmount = Number.isFinite(amount)
                    ? amount
                    : 0;

                item.textContent =
                    `${safeAmount} ${transfer.asset || transfer.currency || ''}` +
                    ` — ${transfer.status || 'Unknown'}` +
                    ` — ${transfer.reference || transfer.transactionReference || 'No reference'}`;

                output.appendChild(item);
            }

            return transfers;
        } catch (error) {
            if (output) {
                output.textContent = error.message;
            }

            throw error;
        }
    }

    window.SkyDropTransfers = Object.freeze({
        submitTransfer,
        loadTransfers
    });

    document.addEventListener('DOMContentLoaded', () => {
        element('transfer-form')?.addEventListener(
            'submit',
            submitTransfer
        );

        element('refresh-transfers')?.addEventListener('click', () => {
            loadTransfers().catch(() => {});
        });
    });
})();
