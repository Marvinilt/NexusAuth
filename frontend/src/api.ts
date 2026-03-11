const API_URL = 'http://localhost:3000';

export class ApiError extends Error {
    public override message: string;
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.message = message;
        this.status = status;
        this.name = 'ApiError';
    }
}

async function request(endpoint: string, options: RequestInit = {}) {
    // If we're hitting a /mfa endpoint and mfaToken exists, prefer it.
    // Otherwise, check for full token.
    const mfaToken = localStorage.getItem('mfaToken');
    const fullToken = localStorage.getItem('token');

    // Logic: If on the verification page or login phase, prioritize mfaToken
    const token = endpoint.includes('/mfa/verify-login') ? (mfaToken || fullToken) : (fullToken || mfaToken);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.error || 'API Request failed', response.status);
    }

    return data;
}

export const api = {
    get: (endpoint: string) => request(endpoint),
    post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};
