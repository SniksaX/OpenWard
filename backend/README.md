# ⚙️ OpenWard Backend

The OpenWard Backend is a lightweight, high-performance Node.js/Express REST API that acts as the orchestrator for your Zero Trust network. 

Instead of running an agent directly on your VPN gateway, this backend operates out-of-band. It establishes secure SSH connections to your WireGuard server to generate cryptographic keys, allocate IPs based on specific Access Zones, and safely inject configurations into `/etc/wireguard/wg0.conf`.

It also maintains an embedded SQLite database to keep track of peer histories, device types, and offline states.

---

## Features

*   **Agentless Architecture**: Communicates with the Gateway securely over SSH (`ssh2`). No proprietary daemons need to be installed on your WireGuard server.
*   **Smart IP Allocation**: Automatically scans `/etc/wireguard/wg0.conf` to find available IPs within a requested Zone's specific subnet boundary (e.g., `.100 - .149` for Employees).
*   **Seamless Provisioning**: Uses `wg set` and `ip route` to apply new identities instantly, without restarting the WireGuard interface (zero downtime).
*   **Stateful Synchronization**: Parses `wg show wg0 dump` to sync real-time bandwidth (Rx/Tx) and handshake data into the local SQLite database.
*   **Client Configuration Generation**: Automatically generates complete client `wg0.conf` text and returns it to the frontend for QR code generation.

---

## Prerequisites

**Important:** This backend utilizes `bun:sqlite` for high-performance database operations. You must have [Bun](https://bun.sh/) installed on your machine to run this project.

*   **Bun** (v1.0+)
*   An SSH Ed25519 Private Key capable of authenticating to your WireGuard Gateway as a user with passwordless `sudo` privileges for `wg`, `iptables`, and `sed`/`cat` commands in `/etc/wireguard`.

---

## Setup & Installation

**1. Navigate to the backend directory and install dependencies:**
```bash
cd backend
bun install
```

**2. Configure your Environment Variables:**
Create a `.env` file in the root of the `backend` directory.

```ini
# Server Config
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# SSH Connection to the WireGuard Gateway
PUBLIC_SERVER_INTERNAL_IP=192.168.1.100       # The IP address of your WireGuard server
SSH_PORT=22                         # SSH Port
SSH_USER=ubuntu                     # SSH Username
SSH_PRIVATE_KEY_PATH=/root/.ssh/id_ed25519 # Path to the SSH private key

# WireGuard Client Generation (Used to build the client config files)
WG_PUBLIC_ENDPOINT=vpn.yourdomain.com
WG_PORT=51820
WG_SERVER_PUBLIC_KEY=your_server_public_key_here
CLIENT_DNS=10.200.200.1
```

**3. Set up Gateway Sudoers (Crucial):**
The SSH user defined in `SSH_USER` must be able to execute commands as `sudo` without a password prompt. On your **Gateway Server**, run `sudo visudo` and add:
```text
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/wg, /usr/bin/cat, /usr/bin/sed, /usr/bin/tee, /usr/bin/grep, /usr/bin/base64, /usr/sbin/ip
```
*(Adjust the paths based on where your binaries live, usually `/usr/bin/` or `/sbin/`)*

---

## Running the Server

To start the backend in development mode (with hot-reloading):
```bash
bun run --watch index.ts
```

To run in production mode:
```bash
bun run index.ts
```

*Note: On the first run, the backend will automatically generate an `openward.db` SQLite file in the directory.*

---

## API Endpoints

All endpoints are prefixed with `/api`. Security operations that interact with the Gateway require the `x-passphrase` header (the password used to decrypt the SSH private key, or authenticate the action).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/status` | Tests the SSH connection to the WireGuard gateway. |
| `GET` | `/api/peers` | Lists all peers currently stored in the local SQLite database. |
| `GET` | `/api/peers/sync` | Connects via SSH, reads `/etc/wireguard/wg0.conf`, pulls live Rx/Tx stats, and synchronizes the local database. |
| `POST` | `/api/peers` | Generates a keypair, allocates an IP based on role, injects into the Gateway, and returns the client config. |
| `PUT` | `/api/peers/:publicKey` | Updates the metadata (Name, Device Type) for a specific peer in the database. |
| `DELETE`| `/api/peers/:publicKey` | Uses `wg set peer remove` and safely scrubs the peer from `/etc/wireguard/wg0.conf`. |

---

## How it Works Under the Hood

### Safe Config Injection
Unlike simple scripts that just append data to the end of the file, OpenWard parses your `wg0.conf` looking for specific Section Headers (e.g., `# / 100-149 / #Employees`). 

When you provision a new Employee identity, the backend formats the peer block, converts it to base64, pipes it over SSH, decodes it into a `.tmp` file, and uses `sed` to inject the configuration directly beneath the correct section header. 

### Seamless Applying
After writing to the file, it runs:
```bash
sudo wg set wg0 peer '<PUBKEY>' allowed-ips <IP>/32
sudo ip route replace <IP>/32 dev wg0
```
This applies the peer to the live interface immediately, ensuring your existing connections are never dropped.
