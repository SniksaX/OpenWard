export type NetworkRole = 'admin' | 'hidden_server' | 'shared_server' | 'employee' | 'gamer' | 'guest';
export type DeviceType = 'server' | 'mobile' | 'desktop';

export interface Peer {
    id: number;
    name: string;
    ip_address: string;
    public_key: string;
    status: string;
    device_type: DeviceType;
    network_role: NetworkRole;
    last_handshake: number;
    transfer_rx: number;
    transfer_tx: number;
    created_at: string;
}

export interface LivePeerStat {
    publicKey: string;
    endpoint: string;
    latestHandshake: number;
    transferRx: number;
    transferTx: number;
}

export interface ConfiguredPeer {
    name: string;
    allowedIps: string;
    role: NetworkRole;
}