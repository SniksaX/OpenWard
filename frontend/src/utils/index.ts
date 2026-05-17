import { Peer } from '../types';

export const getUserIdFromToken = (token: string | null): number => {
  if (!token) return 1;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || 1;
  } catch (e) {
    return 1;
  }
};

export const downloadConfig = (configStr: string, filename: string) => {
  const blob = new Blob([configStr], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Formats raw bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const mapBackendPeerToFrontend = (p: any): Peer => ({
  id: p.id,
  userId: p.user_id || 1,
  name: p.name,
  status: p.status,
  ip: p.ip_address,
  pubKey: p.public_key || '',
  role: p.network_role,
  device: p.device_type,
  rx: p.transfer_rx || 0,
  tx: p.transfer_tx || 0,
  lastSeen: p.last_handshake === 0 ? 'NEVER' : 'ACTIVE',
  endpoint: p.last_endpoint || 'AWAITING_CONNECTION',
  handshake: p.last_handshake || 0,
  latency: '0ms',
  isOnline: false, // Updated later via SSE
});