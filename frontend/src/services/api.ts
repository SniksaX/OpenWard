import { CreatePeerPayload } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchWrapper(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || response.statusText);
    }

    return response.json();
}

export const api = {
    login: async (email?: string, password?: string) => {
        return fetchWrapper('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },
    register: async (username?: string, email?: string, password?: string) => {
        return fetchWrapper('/api/createUser', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    },
    getPeers: async () => {
        return fetchWrapper('/api/peers', {
            method: 'GET',
        });
    },
    getPeerConfig: async (publicKey: string) => {
        return fetchWrapper(`/api/peers/${encodeURIComponent(publicKey)}/config`, {
            method: 'GET',
        });
    },
    revokePeer: async (publicKey: string) => {
        return fetchWrapper(`/api/peers/${encodeURIComponent(publicKey)}`, {
            method: 'DELETE',
        });
    },
    createPeer: async (data: CreatePeerPayload) => {
        return fetchWrapper('/api/createPeer', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};d