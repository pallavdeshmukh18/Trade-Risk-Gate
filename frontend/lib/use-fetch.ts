import { useAuth } from './auth-context';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export function useFetch() {
    const { token } = useAuth();
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

    const fetchWithAuth = async (
        endpoint: string,
        options: FetchOptions = {}
    ) => {
        const authToken = token || localStorage.getItem('token') || localStorage.getItem('auth_token');

        if (!apiUrl) {
            throw new Error('API unavailable. Set NEXT_PUBLIC_API_URL for production.');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${apiUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    };

    return { fetchWithAuth };
}
