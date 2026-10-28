'use strict';

(function () {
    const API_BASE_URL = (
        document.querySelector('meta[name="api-base-url"]')?.content || ''
    ).replace(/\/+$/, '');

    const TOKEN_KEY = 'skydrop_access_token';

    class ApiError extends Error {
        constructor(message, status, data = null) {
            super(message);

            this.name = 'ApiError';
            this.status = status;
            this.data = data;
        }
    }

    function getAccessToken() {
        try {
            return sessionStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    }

    function setAccessToken(token) {
        if (typeof token !== 'string' || !token.trim()) {
            throw new Error('A valid access token is required.');
        }

        sessionStorage.setItem(TOKEN_KEY, token);
    }

    function clearAccessToken() {
        try {
            sessionStorage.removeItem(TOKEN_KEY);
        } catch {
            // Storage may be unavailable in restricted browser contexts.
        }
    }

    async function request(path, options = {}) {
        if (
            typeof path !== 'string' ||
            !path.startsWith('/') ||
            path.startsWith('//')
        ) {
            throw new Error('API paths must be relative paths beginning with /.');
        }

        const {
            method = 'GET',
            body,
            headers = {},
            authenticated = true,
            signal
        } = options;

        const requestHeaders = {
            Accept: 'application/json',
            ...headers
        };

        if (body !== undefined) {
            requestHeaders['Content-Type'] = 'application/json';
        }

        if (authenticated) {
            const token = getAccessToken();

            if (token) {
                requestHeaders.Authorization = `Bearer ${token}`;
            }
        }

        let response;

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers: requestHeaders,
                body: body === undefined
                    ? undefined
                    : JSON.stringify(body),
                credentials: 'same-origin',
                signal
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }

            throw new ApiError(
                'Unable to reach the SkyDrop server. Check your connection.',
                0
            );
        }

        const contentType = response.headers.get('content-type') || '';

        let data = null;

        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch {
                data = null;
            }
        } else {
            const text = await response.text();

            data = text ? { message: text } : null;
        }

        if (!response.ok) {
            const message =
                data?.error ||
                data?.message ||
                `Request failed with HTTP status ${response.status}.`;

            if (response.status === 401) {
                clearAccessToken();

                window.dispatchEvent(
                    new CustomEvent('skydrop:authentication-required')
                );
            }

            throw new ApiError(message, response.status, data);
        }

        return data;
    }

    const api = {
        ApiError,

        getAccessToken,
        setAccessToken,
        clearAccessToken,

        request,

        get(path, options = {}) {
            return request(path, {
                ...options,
                method: 'GET'
            });
        },

        post(path, body, options = {}) {
            return request(path, {
                ...options,
                method: 'POST',
                body
            });
        },

        patch(path, body, options = {}) {
            return request(path, {
                ...options,
                method: 'PATCH',
                body
            });
        },

        delete(path, options = {}) {
            return request(path, {
                ...options,
                method: 'DELETE'
            });
        }
    };

    window.SkyDropAPI = Object.freeze(api);
})();
