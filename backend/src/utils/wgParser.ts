// src/utils/wgParser.ts
import type { ConfiguredPeer, NetworkRole } from "../types";

export const getRoleFromIp = (ip: string): NetworkRole => {
    const parts = ip.split('.');
    if (parts.length !== 4) return 'guest';
    const last = parseInt((parts as any)[3], 10);

    if (last >= 2 && last <= 15) return 'admin';
    if (last >= 16 && last <= 49) return 'hidden_server';
    if (last >= 50 && last <= 99) return 'shared_server';
    if (last >= 100 && last <= 149) return 'employee';
    if (last >= 150 && last <= 199) return 'gamer';
    return 'guest';
};

export const parseWgConfig = (configOutput: string): Map<string, ConfiguredPeer> => {
    const configLines = configOutput.split('\n');
    const configuredPeersMap = new Map<string, ConfiguredPeer>();

    let nextNameCandidate = 'Unknown Peer';
    let currentPeer = { publicKey: '', allowedIps: '', name: '' };
    let inPeerBlock = false;

    const saveCurrentPeer = () => {
        if (inPeerBlock && currentPeer.publicKey) {
            const ip = currentPeer.allowedIps.split('/')[0] || '';
            const role = getRoleFromIp(ip);
            configuredPeersMap.set(currentPeer.publicKey, {
                name: currentPeer.name,
                allowedIps: currentPeer.allowedIps,
                role
            });
        }
    };

    for (const line of configLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('#')) {
            if (trimmed.includes('/') || trimmed.includes('----')) {
                if (trimmed.includes('/')) continue;
            }
            let cleanName = trimmed.replace(/^#/, '').trim();
            cleanName = cleanName.replace(/^Peer:\s*/i, '');
            cleanName = cleanName.replace(/^-+\s*/, '');
            cleanName = cleanName.replace(/\s*-+$/, '');
            if (cleanName && cleanName.length > 0) {
                nextNameCandidate = cleanName;
            }
            continue;
        }

        const lowerLine = trimmed.toLowerCase();

        if (lowerLine === '[peer]') {
            saveCurrentPeer();
            inPeerBlock = true;
            currentPeer = { publicKey: '', allowedIps: '', name: nextNameCandidate };
            nextNameCandidate = 'Unknown Peer';
            continue;
        }

        if (lowerLine.startsWith('[') && lowerLine !== '[peer]') {
            saveCurrentPeer();
            inPeerBlock = false;
            nextNameCandidate = 'Unknown Peer';
            continue;
        }

        if (inPeerBlock) {
            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex === -1) continue;
            const key = trimmed.substring(0, separatorIndex).trim().toLowerCase();
            const value = trimmed.substring(separatorIndex + 1).trim();

            if (key === 'publickey') {
                currentPeer.publicKey = value;
            } else if (key === 'allowedips') {
                currentPeer.allowedIps = value;
            }
        }
    }

    saveCurrentPeer();
    return configuredPeersMap;
};