export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWrapper(endpoint: string, options: RequestInit = {}) {
    // Safely get token (Next.js requires checking if window exists)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || response.statusText);
    }

    return response.json();
}

export const api = {
    login: (email?: string, password?: string) => 
        fetchWrapper('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    
    getPeers: () => 
        fetchWrapper('/api/peers', { method: 'GET' }),
    
    getPeerConfig: (publicKey: string) => 
        fetchWrapper(`/api/peers/${encodeURIComponent(publicKey)}/config`, { method: 'GET' }),
    
    revokePeer: (publicKey: string) => 
        fetchWrapper(`/api/peers/${encodeURIComponent(publicKey)}`, { method: 'DELETE' }),
    
    createPeer: (data: any) => 
        fetchWrapper('/api/createPeer', { method: 'POST', body: JSON.stringify(data) })
};

// Map Go Backend data to v0.dev's UI expectations
export const mapPeer = (p: any) => {
  if (!p) return null;
  return {
    id: p.id || p.public_key,
    operatorId: String(p.user_id || 1),
    identifier: p.name || 'Unknown',
    ip: p.ip_address || '0.0.0.0',
    pubKey: p.public_key || '',
    role: p.network_role || 'standard',
    device: p.device_type || 'server',
    rxTraffic: p.transfer_rx || 0,
    txTraffic: p.transfer_tx || 0,
    status: p.is_online ? 'online' : (p.status === 'active' ? 'idle' : 'offline'),
    lastSeen: p.last_handshake === 0 ? 'NEVER' : 'ACTIVE',
    endpoint: p.last_endpoint || 'AWAITING_CONNECTION',
    handshake: p.last_handshake || 0,
  };
};