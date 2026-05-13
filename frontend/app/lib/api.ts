// app/lib/api.ts
import { API_BASE_URL } from './constants';

export const api = {
    checkStatus: async (passphrase: string) => {
        const res = await fetch(`${API_BASE_URL}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase })
        });
        return res.json();
    },

    syncPeers: async (passphrase: string) => {
        const res = await fetch(`${API_BASE_URL}/peers/sync`, {
            headers: { 'x-passphrase': passphrase }
        });
        return res.json();
    },

    createPeer: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/peers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res;
    },

    updatePeer: async (publicKey: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}/peers/${encodeURIComponent(publicKey)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res;
    },

    revokePeer: async (publicKey: string, passphrase: string) => {
        const res = await fetch(`${API_BASE_URL}/peers/${encodeURIComponent(publicKey)}`, {
            method: 'DELETE',
            headers: { 'x-passphrase': passphrase }
        });
        return res;
    }
};