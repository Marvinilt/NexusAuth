const API_URL = 'http://localhost:3000';

export class ApiError extends Error {
    public override message: string;
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
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
        'x-api-key': import.meta.env.VITE_NEXUS_API_KEY || '',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch {
        throw new ApiError('No se pudo conectar con el servidor backend en http://localhost:3000. Verifica que esté activo.', 0);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.error || 'La solicitud a la API ha fallado', response.status);
    }

    return data;
}

export const api = {
    get: (endpoint: string) => request(endpoint),
    post: (endpoint: string, body?: unknown) => request(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: (endpoint: string, body?: unknown) => request(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
