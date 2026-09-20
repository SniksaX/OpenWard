import type {
  ClaimRequest,
  CreatePeerPayload,
  CreatePeerResponse,
  CreateUserPayload,
  LoginResponse,
  MappedPeer,
  Peer,
  PeerConfigResponse,
  PeersResponse,
  StreamTokenResponse,
  User,
} from '@/lib/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export class ApiError extends Error {
  readonly status: number
  readonly body: string

  constructor(status: number, body: string) {
    let message = body || `HTTP ${status}`
    try {
      const parsed = JSON.parse(body) as { error?: string }
      if (parsed.error) message = parsed.error
    } catch {
      // keep raw body
    }
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new ApiError(response.status, errorBody || response.statusText)
  }

  return response.json() as Promise<T>
}

export const api = {
  login: (email?: string, password?: string) =>
    fetchWrapper<LoginResponse>('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (data: CreateUserPayload) =>
    fetchWrapper<{ message: string }>('/api/createUser', { method: 'POST', body: JSON.stringify(data) }),

  identify: () =>
    fetchWrapper<Record<string, unknown>>('/api/auth/identify', { method: 'GET' }),

  claim: (data: ClaimRequest) =>
    fetchWrapper<LoginResponse>('/api/auth/claim', { method: 'POST', body: JSON.stringify(data) }),

  getUsers: () =>
    fetchWrapper<User[]>('/api/users', { method: 'GET' }),

  getPeers: () =>
    fetchWrapper<PeersResponse>('/api/peers', { method: 'GET' }),

  getPeerConfig: (publicKey: string) =>
    fetchWrapper<PeerConfigResponse>(`/api/peers/${encodeURIComponent(publicKey)}/config`, { method: 'GET' }),

  revokePeer: (publicKey: string) =>
    fetchWrapper<{ message: string }>(`/api/peers/${encodeURIComponent(publicKey)}`, { method: 'DELETE' }),

  createPeer: (data: CreatePeerPayload) =>
    fetchWrapper<CreatePeerResponse>('/api/createPeer', { method: 'POST', body: JSON.stringify(data) }),

  getStreamToken: () =>
    fetchWrapper<StreamTokenResponse>('/api/streamToken', { method: 'POST' }),
}

export const mapPeer = (p: Peer | null | undefined): MappedPeer | null => {
  if (!p) return null
  return {
    id: String(p.id ?? p.public_key),
    operatorId: p.user_id == null ? null : String(p.user_id),
    identifier: p.name || 'Unknown',
    ip: p.ip_address || '0.0.0.0',
    pubKey: p.public_key || '',
    role: p.network_role || 'guest',
    device: p.device_type || 'server',
    rxTraffic: p.transfer_rx || 0,
    txTraffic: p.transfer_tx || 0,
    status: p.status === 'active' ? 'idle' : 'offline',
    lastSeen: p.last_handshake === 0 ? 'NEVER' : 'ACTIVE',
    endpoint: p.last_endpoint || 'AWAITING_CONNECTION',
    handshake: p.last_handshake || 0,
  }
}
