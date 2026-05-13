// src/services/wireguardService.ts
import { SSHService } from './sshService';
import type { NetworkRole, LivePeerStat, ConfiguredPeer } from '../types';
import { parseWgConfig } from '../utils/wgParser';

export class WireguardService {
    private sshService: SSHService;

    constructor(sshService: SSHService) {
        this.sshService = sshService;
    }

    public async getAvailableIp(role: NetworkRole, passphrase?: string): Promise<string> {
        const command = `sudo grep -a AllowedIPs /etc/wireguard/wg0.conf | grep -oE '10\\.200\\.200\\.[0-9]+' || true`;
        const output = await this.sshService.executeCommand(command, passphrase);
        const usedIps = new Set(output.split('\n').map(ip => ip.trim()).filter(ip => ip.length > 0));

        let start = 200, end = 254;

        if (role === 'admin') { start = 2; end = 15; }
        else if (role === 'hidden_server') { start = 16; end = 49; }
        else if (role === 'shared_server') { start = 50; end = 99; }
        else if (role === 'employee') { start = 100; end = 149; }
        else if (role === 'gamer') { start = 150; end = 199; }
        else if (role === 'guest') { start = 200; end = 254; }
        else { throw new Error(`Invalid network role: ${role}`); }

        for (let i = start; i <= end; i++) {
            const candidateIp = `10.200.200.${i}`;
            if (!usedIps.has(candidateIp)) {
                return candidateIp;
            }
        }
        throw new Error(`The IP subnet for the role '${role}' is completely full!`);
    }

    public async generateKeys(passphrase?: string): Promise<{ privateKey: string, publicKey: string }> {
        const privateKey = (await this.sshService.executeCommand('wg genkey', passphrase)).trim();
        const publicKey = (await this.sshService.executeCommand(`echo '${privateKey}' | wg pubkey`, passphrase)).trim();
        return { privateKey, publicKey };
    }

    public async appendPeerToConfig(name: string, publicKey: string, ipAddress: string, passphrase?: string): Promise<void> {
        const checkCommand = `sudo grep -q "${publicKey}" /etc/wireguard/wg0.conf && echo "EXISTS" || echo "NEW"`;
        const checkResult = await this.sshService.executeCommand(checkCommand, passphrase);
        if (checkResult.trim() === 'EXISTS') return;

        const lastOctet = parseInt((ipAddress as any).split('.')[3], 10);
        let searchHeader = "";

        if (lastOctet >= 2 && lastOctet <= 15) searchHeader = "# / 02-15 / #Admin";
        else if (lastOctet >= 16 && lastOctet <= 49) searchHeader = "# / 16-49 / #Hidden servers";
        else if (lastOctet >= 50 && lastOctet <= 99) searchHeader = "# / 50-99 / #Shared servers";
        else if (lastOctet >= 100 && lastOctet <= 149) searchHeader = "# / 100-149 / #Employees";
        else if (lastOctet >= 150 && lastOctet <= 199) searchHeader = "# / 150-199 / #Gamers";
        else searchHeader = "# / 200-254 / #Guests";

        const sedSafeHeader = searchHeader.replace(/\//g, '\\/');

        const configBlock = `\n# --- ${name} ---\n[Peer]\nPublicKey = ${publicKey}\nAllowedIPs = ${ipAddress}/32\n`;
        const b64Config = Buffer.from(configBlock).toString('base64');

        const command = `
            echo "${b64Config}" | base64 -d > /tmp/new_peer.tmp && 
            if sudo grep -Fq "${searchHeader}" /etc/wireguard/wg0.conf; then
                sudo sed -i '/${sedSafeHeader}/r /tmp/new_peer.tmp' /etc/wireguard/wg0.conf
            else
                sudo cat /tmp/new_peer.tmp | sudo tee -a /etc/wireguard/wg0.conf > /dev/null
            fi && 
            rm /tmp/new_peer.tmp
        `;

        await this.sshService.executeCommand(command, passphrase);
    }

    public async applyPeerSeamlessly(publicKey: string, ipAddress: string, passphrase?: string): Promise<void> {
        const wgCommand = `sudo wg set wg0 peer '${publicKey}' allowed-ips ${ipAddress}/32`;
        await this.sshService.executeCommand(wgCommand, passphrase);

        const routeCommand = `sudo ip route replace ${ipAddress}/32 dev wg0`;
        await this.sshService.executeCommand(routeCommand, passphrase);
    }

    public async removePeerFromFile(publicKey: string, passphrase?: string): Promise<void> {
        const configOutput = await this.sshService.executeCommand('sudo cat /etc/wireguard/wg0.conf', passphrase);
        const lines = configOutput.split('\n');

        const blocks: string[][] = [];
        let currentBlock: string[] = [];

        for (const line of lines) {
            const lowerLine = line.trim().toLowerCase();
            const isPeerComment = lowerLine.startsWith('# peer:');
            const isSection = lowerLine.startsWith('[');

            if (isPeerComment) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock);
                    currentBlock = [];
                }
            } else if (isSection) {
                const isJustCommentsAndEmpty = currentBlock.every(l => {
                    const t = l.trim();
                    return t.startsWith('#') || t === '';
                });

                if (!isJustCommentsAndEmpty && currentBlock.length > 0) {
                    blocks.push(currentBlock);
                    currentBlock = [];
                }
            }
            currentBlock.push(line);
        }

        if (currentBlock.length > 0) {
            blocks.push(currentBlock);
        }

        const newConfigBlocks = blocks.filter(block => {
            let hasPublicKey = false;
            for (const line of block) {
                if (line.trim().toLowerCase().startsWith('publickey') && line.includes(publicKey)) {
                    hasPublicKey = true;
                }
            }
            return !hasPublicKey;
        });

        const configString = newConfigBlocks.map(b => b.join('\n')).join('\n');
        const b64Config = Buffer.from(configString).toString('base64');
        const writeCmd = `echo "${b64Config}" | base64 -d | sudo tee /etc/wireguard/wg0.conf > /dev/null`;

        await this.sshService.executeCommand(writeCmd, passphrase);
    }

    public async getRemoteState(passphrase?: string): Promise<{ configured: Map<string, ConfiguredPeer>, live: Map<string, LivePeerStat> }> {
        const configOutput = await this.sshService.executeCommand('sudo cat /etc/wireguard/wg0.conf', passphrase);
        const configuredPeersMap = parseWgConfig(configOutput);

        const dump = await this.sshService.executeCommand('sudo wg show wg0 dump', passphrase);
        const dumpLines = dump.trim().split('\n');

        const liveStatsMap = new Map<string, LivePeerStat>();

        dumpLines.slice(1).forEach(line => {
            if (!line.trim()) return;
            const parts = line.split('\t');
            liveStatsMap.set((parts as any)[0], {
                publicKey: parts[0],
                endpoint: parts[2] || '',
                latestHandshake: parseInt(parts[4] || '0', 10),
                transferRx: parseInt(parts[5] || '0', 10),
                transferTx: parseInt(parts[6] || '0', 10),
            });
        });

        return { configured: configuredPeersMap, live: liveStatsMap };
    }
}