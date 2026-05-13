// src/controllers/peerController.ts
import type { Request, Response } from 'express';
import { SSHService } from '../services/sshService';
import { WireguardService } from '../services/wireguardService';
import * as db from '../db/database';
import { config } from '../config/env';
import type { NetworkRole } from '../types';

const sshService = new SSHService();
const wgService = new WireguardService(sshService);

const getPassphrase = (req: Request): string | undefined => {
    const headerPass = req.headers['x-passphrase'];
    return Array.isArray(headerPass) ? headerPass[0] : headerPass;
};

export const listPeers = (req: Request, res: Response) => {
    try {
        const peers = db.getPeers();
        return res.status(200).json({ peers });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to retrieve peers.' });
    }
};

export const syncPeers = async (req: Request, res: Response) => {
    try {
        const passphrase = getPassphrase(req);
        const { configured, live } = await wgService.getRemoteState(passphrase);
        const dbPeers = db.getPeers();

        for (const dbPeer of dbPeers) {
            const configData = configured.get(dbPeer.public_key);
            const liveData = live.get(dbPeer.public_key);

            if (liveData) {
                db.updatePeerStats(dbPeer.public_key, liveData.latestHandshake, liveData.transferRx, liveData.transferTx, liveData.endpoint);
            }

            if (configData) {
                if (dbPeer.name !== configData.name || dbPeer.network_role !== configData.role) {
                    db.updatePeerDetails(dbPeer.public_key, configData.name, dbPeer.device_type, configData.role);
                }
            } else {
                if (dbPeer.status === 'active') {
                    db.updatePeerStatus(dbPeer.public_key, 'archived');
                }
            }
        }

        const dbPubKeySet = new Set(dbPeers.map(p => p.public_key));
        for (const [pubKey, data] of configured.entries()) {
            if (!dbPubKeySet.has(pubKey)) {
                const ip = data.allowedIps.split('/')[0] || '';
                db.addPeerRecord(data.name, ip, pubKey, 'server', data.role);
                db.addPeerHistory(pubKey, 'discovered_from_config');
            }
        }

        const peers = db.getPeers();
        return res.status(200).json({ peers });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to synchronize with Gateway.', details: error.message });
    }
};

export const addPeer = async (req: Request, res: Response) => {
    const { name, passphrase, useAdguard, fullTunnel, device_type, network_role } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Peer name is required and must be a string.' });
    }

    const role: NetworkRole = network_role || 'guest';
    let allocatedIp: string;

    try {
        allocatedIp = await wgService.getAvailableIp(role, passphrase);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const { privateKey, publicKey } = await wgService.generateKeys(passphrase);
        await wgService.appendPeerToConfig(name, publicKey, allocatedIp, passphrase);
        await wgService.applyPeerSeamlessly(publicKey, allocatedIp, passphrase);

        db.addPeerRecord(name, allocatedIp, publicKey, device_type || 'server', role);

        const dnsString = useAdguard ? config.wireguard.defaultDns : '1.1.1.1, 1.0.0.1';
        const allowedIpsString = fullTunnel ? '0.0.0.0/0, ::/0' : '10.200.200.0/24';

        const clientConfig = `[Interface]
PrivateKey = ${privateKey}
Address = ${allocatedIp}/24
DNS = ${dnsString}

[Peer]
PublicKey = ${config.wireguard.serverPublicKey}
Endpoint = ${config.wireguard.publicEndpoint}:${config.wireguard.port}
AllowedIPs = ${allowedIpsString}
PersistentKeepalive = 25`;

        db.addPeerHistory(publicKey, 'created', clientConfig);

        return res.status(201).json({
            message: 'Peer created successfully.',
            clientConfig,
            peer: { name, ip: allocatedIp, publicKey, device_type: device_type || 'server', network_role: role }
        });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to create new peer.' });
    }
};

export const updatePeer = async (req: Request, res: Response) => {
    const { publicKey } = req.params as any;
    const { name, device_type, network_role } = req.body;

    try {
        const peers = db.getPeers();
        const peer = peers.find(p => p.public_key === publicKey);

        if (!peer) {
            return res.status(404).json({ error: 'Peer not found.' });
        }

        if (network_role && network_role !== peer.network_role) {
            return res.status(400).json({
                error: 'Cannot change network role on the fly. Please delete and recreate the peer to assign it to the new IP Subnet Zone.'
            });
        }

        db.updatePeerDetails(publicKey, name || peer.name, device_type || peer.device_type, peer.network_role);
        db.addPeerHistory(publicKey, 'details_updated', `Name: ${name || peer.name}`);

        return res.status(200).json({ message: 'Peer updated successfully.' });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to update peer.' });
    }
};

export const deletePeer = async (req: Request, res: Response) => {
    const { publicKey } = req.params as any;
    const passphrase = getPassphrase(req);

    try {
        const peers = db.getPeers();
        const peer = peers.find(p => p.public_key === publicKey);

        if (!peer) {
            return res.status(404).json({ error: 'Peer not found.' });
        }

        await sshService.executeCommand(`sudo wg set wg0 peer '${publicKey}' remove`, passphrase);
        await wgService.removePeerFromFile(publicKey, passphrase);

        db.revokePeerRecord(publicKey);

        return res.status(200).json({ message: 'Peer revoked successfully.' });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to revoke peer.' });
    }
};