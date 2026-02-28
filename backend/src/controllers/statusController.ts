// src/controllers/statusController.ts
import type { Request, Response } from 'express';
import { SSHService } from '../services/sshService';
import { config } from '../config/env';

const sshService = new SSHService();

export const checkStatus = async (req: Request, res: Response) => {
    try {
        const { passphrase } = req.body;
        const output = await sshService.executeCommand('echo "SSH OK"', passphrase);
        return res.status(200).json({
            status: 'connected',
            message: output.trim(),
        });
    } catch (error: any) {
        return res.status(500).json({
            status: 'disconnected',
            error: 'Failed to establish SSH connection to the Gateway server.',
            details: config.nodeEnv === 'development' ? error.message : undefined
        });
    }
};