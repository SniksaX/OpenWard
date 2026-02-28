// app/types/index.ts
export interface Peer {
    id: number;
    name: string;
    ip_address: string;
    public_key: string;
    status: string;
    device_type: string;
    network_role: string;
    last_handshake: number;
    transfer_rx: number;
    transfer_tx: number;
    created_at: string;
}

export interface Zone {
    id: string;
    label: string;
    range?: string;
    capacity?: number;
    color: string;
    text: string;
    border: string;
}

export interface ConnectionStatus {
    label: string;
    color: string;
    dot: string;
}

export type SortOption = 'name-asc' | 'name-desc' | 'ip-asc' | 'rx-desc' | 'tx-desc' | 'recent-desc';