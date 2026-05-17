export interface Peer {
  id: string;
  userId: number;
  name: string;
  status: 'active' | 'inactive' | 'error';
  ip: string;
  pubKey: string;
  role: string;
  device: string;
  rx: number;
  tx: number;
  lastSeen: string;
  endpoint: string;
  handshake: number;
  latency: string;
  isOnline: boolean;
}

export interface CreatePeerPayload {
  name: string;
  user_id: number;
  device_type: string;
  network_role: string;
  use_adguard: boolean;
  full_tunnel: boolean;
  passphrase?: string;
}