/**
 * Authenticated fetch helper for HyperZ admin pages.
 * Automatically attaches the JWT token from localStorage.
 */

const TOKEN_KEY = 'hyperz_admin_token';

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type for JSON bodies
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    return fetch(url, { ...options, headers });
}

/**
 * Convenience for GET + JSON parse.
 */
export async function adminGet<T = any>(url: string): Promise<T> {
    const res = await adminFetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Convenience for POST + JSON.
 */
export async function adminPost<T = any>(url: string, body: any): Promise<T> {
    const res = await adminFetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return res.json();
}
