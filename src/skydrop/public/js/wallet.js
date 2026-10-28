'use strict';

(function () {
    const API = window.SkyDropAPI;

    if (!API) {
        throw new Error('Load api.js before wallet.js.');
    }

    function formatNumber(value, maximumFractionDigits = 8) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return '0';
        }

        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits
        }).format(number);
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

    function displayValue(elementId, value) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = value;
        }
    }

    function getWalletData(response) {
        if (response?.wallet) {
            return response.wallet;
        }

        if (response?.data?.wallet) {
            return response.data.wallet;
        }

        if (response?.data) {
            return response.data;
        }

        return response;
    }

    async function loadWallet() {
        displayValue('wallet-status', 'Loading wallet...');

        try {
            const response = await API.get('/api/wallet');
            const wallet = getWalletData(response);

            if (!wallet || typeof wallet !== 'object') {
                throw new Error('The server returned invalid wallet data.');
            }

            const skdBalance = wallet.skdBalance ?? wallet.balanceSKD ?? 0;
            const usdBalance = wallet.usdBalance ?? wallet.balanceUSD ?? 0;
            const ngnBalance = wallet.ngnBalance ?? wallet.balanceNGN ?? 0;

            displayValue(
                'wallet-skd-balance',
                `${formatNumber(skdBalance)} SKD`
            );

            displayValue(
                'wallet-usd-balance',
                formatCurrency(usdBalance, 'USD')
            );

            displayValue(
                'wallet-ngn-balance',
                formatCurrency(ngnBalance, 'NGN')
            );

            displayValue('wallet-status', 'Wallet loaded successfully.');

            return wallet;
        } catch (error) {
            displayValue('wallet-status', error.message);

            throw error;
        }
    }

    window.SkyDropWallet = Object.freeze({
        loadWallet
    });

    document.addEventListener('DOMContentLoaded', () => {
        const refreshButton = document.getElementById('refresh-wallet');

        refreshButton?.addEventListener('click', () => {
            loadWallet().catch(() => {});
        });
    });
})();
