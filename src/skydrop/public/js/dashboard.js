'use strict';

(function () {
    const API = window.SkyDropAPI;

    if (!API) {
        throw new Error('Load api.js before dashboard.js.');
    }

    function element(id) {
        return document.getElementById(id);
    }

    function setStatus(message) {
        const output = element('dashboard-status');

        if (output) {
            output.textContent = message;
        }
    }

    function setText(id, value) {
        const target = element(id);

        if (target) {
            target.textContent = value == null
                ? '—'
                : String(value);
        }
    }

    function formatCurrency(value, currency = 'NGN') {
        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return 'Unavailable';
        }

        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2
        }).format(amount);
    }

    function renderRecentTransactions(transactions) {
        const output = element('dashboard-recent-transactions');

        if (!output) {
            return;
        }

        output.replaceChildren();

        if (!Array.isArray(transactions) || transactions.length === 0) {
            output.textContent = 'No recent transactions.';
            return;
        }

        for (const transaction of transactions.slice(0, 5)) {
            const item = document.createElement('li');

            const amount = Number(transaction.amount);
            const safeAmount = Number.isFinite(amount)
                ? amount
                : 0;

            const currency = transaction.currency || 'NGN';

            item.textContent =
                `${transaction.type || transaction.transactionType || 'Transaction'}: ` +
                `${formatCurrency(safeAmount, currency)} — ` +
                `${transaction.status || 'Unknown'}`;

            output.appendChild(item);
        }
    }

    async function loadDashboard() {
        setStatus('Loading dashboard...');

        try {
            const response = await API.get('/api/dashboard');

            const dashboard = response?.data ?? response;

            if (!dashboard || typeof dashboard !== 'object') {
                throw new Error('The server returned invalid dashboard data.');
            }

            const wallet = dashboard.wallet || {};

            setText(
                'dashboard-skd-balance',
                `${Number(wallet.skdBalance ?? 0)} SKD`
            );

            setText(
                'dashboard-usd-balance',
                formatCurrency(wallet.usdBalance ?? 0, 'USD')
            );

            setText(
                'dashboard-ngn-balance',
                formatCurrency(wallet.ngnBalance ?? 0, 'NGN')
            );

            renderRecentTransactions(
                dashboard.recentTransactions ||
                dashboard.transactions ||
                []
            );

            setStatus('Dashboard updated.');

            return dashboard;
        } catch (error) {
            setStatus(error.message);

            throw error;
        }
    }

    async function refresh() {
        const results = await Promise.allSettled([
            loadDashboard(),

            window.SkyDropWallet
                ? window.SkyDropWallet.loadWallet()
                : Promise.resolve(null),

            window.SkyDropTransactions
                ? window.SkyDropTransactions.loadTransactions(1)
                : Promise.resolve(null)
        ]);

        const failed = results.filter(
            (result) => result.status === 'rejected'
        );

        if (failed.length > 0) {
            setStatus(
                'Some dashboard information could not be loaded. ' +
                'Check the relevant section for details.'
            );
        }

        return results;
    }

    window.SkyDropDashboard = Object.freeze({
        loadDashboard,
        refresh
    });

    document.addEventListener('DOMContentLoaded', () => {
        element('refresh-dashboard')?.addEventListener('click', () => {
            refresh().catch(() => {});
        });

        refresh().catch(() => {});
    });
})();
