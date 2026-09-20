export type NetworkRole =
  | 'admin'
  | 'hidden_server'
  | 'shared_server'
  | 'employee'
  | 'gamer'
  | 'guest'

export type DeviceType = 'server' | 'mobile' | 'desktop'

export type PeerStatus = 'online' | 'warning' | 'offline' | 'idle'

/** Mirrors backend/src/types/peers.type.go Peer. ClientConfig is json:"-" so it is omitted. */
export interface Peer {
  id: number
  name: string
  user_id: number | null
  ip_address: string
  public_key: string
  status: string
  device_type: DeviceType
  network_role: NetworkRole
  last_handshake: number
  transfer_rx: number
  transfer_tx: number
  last_endpoint: string
  allowed_ips: string
  created_at: string
  revoked_at: string | null
}

/** Mirrors backend/src/types/users.type.go UserCred. Password is json:"-" and is never serialised. */
export interface User {
  id: number
  username: string
  email: string
  role: string
}

/** Mirrors backend/src/types/peers.type.go LivePeerStats. */
export interface LivePeerStats {
  public_key: string
  endpoint: string
  last_handshake: number
  transfer_rx: number
  transfer_tx: number
  is_online: boolean
  latency_ms: number
}

/** Mirrors backend/src/types/peers.type.go CreatePeer. */
export interface CreatePeerPayload {
  name: string
  user_id: number | null
  passphrase: string
  use_adguard: boolean
  full_tunnel: boolean
  device_type: DeviceType
  network_role: NetworkRole
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role: string
}

export interface ClaimRequest {
  peer_id: number
  username: string
  email: string
  password: string
}

export interface MappedPeer {
  id: string
  operatorId: string | null
  identifier: string
  ip: string
  pubKey: string
  publicKey?: string
  role: NetworkRole | string
  device: string
  rxTraffic: number
  txTraffic: number
  status: PeerStatus
  lastSeen: string
  endpoint: string
  handshake: number
}

export interface TrafficPoint {
  time: string
  rx: number
  tx: number
}

export interface LoginResponse {
  message: string
  token: string
}

export interface StreamTokenResponse {
  token: string
}

export interface PeersResponse {
  peers: Peer[]
}

export interface CreatePeerResponse {
  message: string
  client_config?: string
}

export interface PeerConfigResponse {
  config: string
}

export interface JwtClaims {
  user_id?: number
  username?: string
  role?: string
  exp?: number
}
