'use strict';

(function () {
    const API = window.SkyDropAPI;

    if (!API) {
        throw new Error('Load api.js before transactions.js.');
    }

    const PAGE_SIZE = 20;

    let currentPage = 1;
    let totalPages = 1;

    function element(id) {
        return document.getElementById(id);
    }

    function formatAmount(value, currency = 'NGN') {
        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return 'Unavailable';
        }

        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency,
            maximumFractionDigits: 8
        }).format(amount);
    }

    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 'Unknown date';
        }

        return date.toLocaleString();
    }

    function setStatus(message) {
        const status = element('transactions-status');

        if (status) {
            status.textContent = message;
        }
    }

    function normalizeResponse(response) {
        const result = response?.data ?? response;

        const transactions = Array.isArray(result)
            ? result
            : result?.transactions;

        if (!Array.isArray(transactions)) {
            throw new Error(
                'The transaction endpoint returned an unexpected response.'
            );
        }

        return {
            transactions,
            total: Number(result?.total ?? transactions.length),
            page: Number(result?.page ?? currentPage),
            limit: Number(result?.limit ?? PAGE_SIZE)
        };
    }

    function createCell(value) {
        const cell = document.createElement('td');

        cell.textContent = value == null ? '—' : String(value);

        return cell;
    }

    function renderTransactions(transactions) {
        const tableBody = element('transactions-table-body');

        if (!tableBody) {
            return;
        }

        tableBody.replaceChildren();

        if (transactions.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 5;
            cell.textContent = 'No transactions found.';
            row.appendChild(cell);

            tableBody.appendChild(row);

            return;
        }

        for (const transaction of transactions) {
            const row = document.createElement('tr');

            const type = transaction.type || transaction.transactionType || 'Unknown';
            const amount = transaction.amount ?? transaction.value ?? 0;
            const currency = transaction.currency || 'NGN';
            const status = transaction.status || 'Unknown';
            const date = transaction.createdAt || transaction.created_at;

            row.append(
                createCell(type),
                createCell(formatAmount(amount, currency)),
                createCell(status),
                createCell(formatDate(date)),
                createCell(transaction.reference || transaction.referenceId || '—')
            );

            tableBody.appendChild(row);
        }
    }

    function updatePagination(total, page, limit) {
        totalPages = Math.max(1, Math.ceil(total / limit));
        currentPage = Math.min(Math.max(1, page), totalPages);

        const pageLabel = element('transactions-page');

        if (pageLabel) {
            pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
        }

        const previousButton = element('transactions-previous');
        const nextButton = element('transactions-next');

        if (previousButton) {
            previousButton.disabled = currentPage <= 1;
        }

        if (nextButton) {
            nextButton.disabled = currentPage >= totalPages;
        }
    }

    async function loadTransactions(page = currentPage) {
        currentPage = Math.max(1, Number(page) || 1);

        setStatus('Loading transaction history...');

        try {
            const response = await API.get(
                `/api/transactions?page=${currentPage}&limit=${PAGE_SIZE}`
            );

            const result = normalizeResponse(response);

            renderTransactions(result.transactions);

            updatePagination(
                result.total,
                result.page,
                result.limit
            );

            setStatus(
                `${result.total} transaction(s) found.`
            );

            return result;
        } catch (error) {
            setStatus(error.message);

            throw error;
        }
    }

    window.SkyDropTransactions = Object.freeze({
        loadTransactions
    });

    document.addEventListener('DOMContentLoaded', () => {
        element('refresh-transactions')?.addEventListener('click', () => {
            loadTransactions().catch(() => {});
        });

        element('transactions-previous')?.addEventListener('click', () => {
            if (currentPage > 1) {
                loadTransactions(currentPage - 1).catch(() => {});
            }
        });

        element('transactions-next')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadTransactions(currentPage + 1).catch(() => {});
            }
        });
    });
})();
