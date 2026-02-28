# 🖥️ OpenWard Frontend (Enterprise Dashboard)

The OpenWard Frontend is a sleek, modern, and highly responsive Next.js web application that serves as the command center for your Zero Trust network. 

Designed with an "Enterprise Dashboard" aesthetic, it provides a single pane of glass to provision identities, monitor real-time bandwidth consumption, track device connection states, and visualize your network's Access Zone capacity.

---

## Features

*   **Cryptographic Vault Access**: The dashboard is locked by default. It requires the Gateway's SSH Vault Passphrase to establish the connection and decrypt the orchestrator's commands.
*   **One-Click Provisioning**: Instantly generate new WireGuard identities. The dashboard automatically returns a secure QR Code and a copyable `wg0.conf` text block for immediate client onboarding.
*   **Real-Time Telemetry**: Polls the backend every 15 seconds to display live Rx/Tx bandwidth metrics, connection statuses (Online, Away, Offline), and the last handshake time.
*   **Capacity Matrix**: Visual progress bars showing exactly how many IPs are consumed in each specific Access Zone subnet to prevent exhaustion.
*   **Smart Filtering & Sorting**: Quickly search for peers by Name, IP, or Public Key. Sort by Highest Download, Most Active, or filter by specific Device Classes (iOS, Windows, Server, etc.).
*   **AdGuard Integration**: Clicking a peer's IP address instantly opens their specific DNS query logs in your Gateway's AdGuard Home instance.

---

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Fonts**: Geist & Geist Mono (Optimized for data-dense dashboards)
*   **QR Generation**: `qrcode.react` for rendering high-fidelity client configuration QR codes.

---

## Prerequisites

*   Node.js (v18+) or [Bun](https://bun.sh/)
*   The **OpenWard Backend** must be running and accessible.

---

## Setup & Installation

**1. Navigate to the frontend directory and install dependencies:**
```bash
cd frontend
npm install
# or if using bun:
bun install
```

**2. Configure your Environment Variables:**
Create a `.env.local` file in the root of the `frontend` directory. You only need to define the API URL where your OpenWard backend is running.

```ini
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**3. Run the Development Server:**
```bash
npm run dev
# or
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

**4. Build for Production:**
To compile the Next.js application for production deployment:
```bash
npm run build
npm run start
```

---

## UI / UX Concepts

### The "Vault" Passphrase
When you load the dashboard, you are greeted with a Gateway Authentication screen. The passphrase entered here is not stored in a database; it is held in memory and passed securely via the `x-passphrase` HTTP header to the backend. The backend uses this to unlock the SSH Private Key and communicate with the WireGuard gateway.

### Immutable Cryptographic Constraints
When modifying an existing identity via the "Edit" modal, you will notice that the **Network Zone** and **DNS** settings are locked and greyed out. 
Because IP addresses dictate firewall rules (`iptables`), and IPs are burned directly into the client's local WireGuard interface at the time of creation, you cannot simply change a peer's zone on the fly. To move a user from the "Employee" zone to the "Admin" zone, you must explicitly revoke their current identity and provision a new one.

### Device Classes
Icons visually represent what type of device is connecting to the network (Server, iOS, Android, macOS, Windows, Linux). This makes auditing the active peer list incredibly intuitive at a glance.

---

## External Integrations

**AdGuard Home (DNS Filtering)**
By default, the dashboard assumes you are running a DNS sinkhole (like AdGuard Home) on the Gateway at `10.200.200.1:8080`.
Inside the Peer Table, clicking on a peer's Network IP automatically opens a new tab directed to the AdGuard query log, pre-filtered for that specific user's IP address. This is incredibly useful for troubleshooting blocked domains or auditing traffic.
