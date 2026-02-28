// src/services/sshService.ts
import { Client } from 'ssh2';
import type { ClientChannel } from 'ssh2';
import * as fs from 'fs';
import { config } from '../config/env';

export class SSHService {
    public executeCommand(command: string, passphrase?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let privateKey: string;
            try {
                privateKey = fs.readFileSync(config.ssh.privateKeyPath, 'utf-8');
            } catch (err) {
                return reject(new Error(`Failed to read SSH private key at ${config.ssh.privateKeyPath}`));
            }

            const conn = new Client();

            conn.on('ready', () => {
                conn.exec(command, (err: Error | undefined, stream: ClientChannel) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }

                    let output = '';
                    let errorOutput = '';

                    stream.on('data', (data: Buffer) => {
                        output += data.toString();
                    });

                    stream.stderr.on('data', (data: Buffer) => {
                        errorOutput += data.toString();
                    });

                    stream.on('close', (code: number) => {
                        conn.end();
                        if (code !== 0) {
                            return reject(new Error(`Command exited with code ${code}. Error: ${errorOutput.trim()}`));
                        }
                        resolve(output);
                    });
                });
            }).on('error', (err: Error) => {
                reject(new Error(`SSH Connection Error: ${err.message}`));
            }).connect({
                host: config.ssh.host,
                port: config.ssh.port,
                username: config.ssh.user,
                privateKey: privateKey,
                passphrase: passphrase,
                algorithms: { serverHostKey: ['ssh-ed25519'] }
            });
        });
    }
}