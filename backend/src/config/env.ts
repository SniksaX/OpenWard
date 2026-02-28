import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 4000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    ssh: {
        host: process.env.OVH_INTERNAL_IP || '',
        port: parseInt(process.env.SSH_PORT || '22', 10),
        user: process.env.SSH_USER || '',
        privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH || ''
    },
    wireguard: {
        publicEndpoint: process.env.WG_PUBLIC_ENDPOINT || '',
        port: process.env.WG_PORT || '51820',
        serverPublicKey: process.env.WG_SERVER_PUBLIC_KEY || '<MISSING_SERVER_PUBLIC_KEY>',
        defaultDns: process.env.CLIENT_DNS || '10.200.200.1'
    }
};

if (!config.ssh.host || !config.ssh.user || !config.ssh.privateKeyPath) {
    console.error('🚨 [Config] Missing critical SSH environment variables!');
}