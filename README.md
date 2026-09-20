
<img width="1024" height="194" alt="openward-lockup-green" src="https://github.com/user-attachments/assets/72449f29-4cad-4c1f-945d-533bb03a174d" />


<table>
  <tr>
    <td colspan="2">
      <img width="100%" alt="Dashboard" src="https://github.com/user-attachments/assets/11792ecf-a0f8-440f-a045-054f39176832" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img width="100%" alt="Peers" src="https://github.com/user-attachments/assets/54a6d777-6868-40a1-908c-8b34e8313f65" />
    </td>
    <td width="50%">
      <img width="100%" alt="Deploy" src="https://github.com/user-attachments/assets/a223259a-70eb-4878-ab5e-1b0025fbb52c" />
    </td>
  </tr>
  
  <tr>
    <td colspan="2">
      <img width="100%"  alt="Device Add" src="https://github.com/user-attachments/assets/8f4a2902-a278-4dd0-8fe9-eb8cce352465" />
    </td>
  </tr>
</table>


**Zone-Based Zero Trust Network Access (ZTNA) built on WireGuard.**

OpenWard transforms a standard WireGuard VPN into a highly secure, stateful, and segmented Zero Trust enterprise network. By combining native WireGuard cryptography with strict `iptables` rules and an intuitive management dashboard, OpenWard isolates user traffic, prevents lateral malware movement, and allows you to manage network access seamlessly.


---

## Overview

Standard VPNs often provide "flat" networks—once a user connects, they can ping and access any other device on the network. **OpenWard fixes this.**

Instead of a flat topology, OpenWard assigns every provisioned identity (peer) to a specific **Access Zone** based on their allocated IP address. Strict `iptables` firewall rules are enforced at the network interface level to ensure that devices can only communicate with authorized endpoints.

The project consists of three main parts:
1. **The WireGuard Gateway**: A Linux server running WireGuard and `iptables` that handles the actual traffic routing and firewalling.
2. **The Backend**: A Go API (`module openward`) using `database/sql` + SQLite and `net/http` ServeMux. It runs **on the Gateway itself** — it owns `/etc/wireguard/wg0.conf` and regenerates it from the database whenever peers change. No SSH orchestration, no agents.
3. **The Frontend**: A Next.js dashboard, exported as static files and served directly by the Go binary from `SERVE_DIR`. Single origin, no separate web server.

---

## Architecture & Access Zones

OpenWard uses a `/24` subnet (`10.200.200.0/24`), mathematically segmented into 6 distinct zones. The firewall rules act as a one-way mirror: humans can access servers (if permitted), but servers cannot initiate connections to humans (preventing malware/ransomware spread).

| Zone | IP Range | Capacity | Network Privileges & Restrictions |
| :--- | :--- | :--- | :--- |
| **Admins** | `.2 - .15` | 14 | **Full Access.** Can access all servers and other devices. The API only accepts admin calls from this range. |
| **Hidden Servers** | `.16 - .49` | 34 | **Isolated.** Accessible *only* by Admins. Cannot initiate outbound connections to any human devices. |
| **Shared Servers** | `.50 - .99` | 50 | **Standard Access.** Accessible by Admins and Employees. Cannot initiate outbound connections to humans. |
| **Employees** | `.100 - .149` | 50 | **Restricted.** Can access Shared Servers and the Internet. *Blocked* from reaching Admins, Hidden Servers, Guests, or other Employees. |
| **Gamers** | `.150 - .199` | 50 | **Isolated Tier.** Can access the Internet and other Gamers. *Blocked* from Admins, Servers, Employees, and Guests. |
| **Guests** | `.200 - .254` | 55 | **Internet Only.** Cannot initiate connections to *anything* inside the VPN subnet. |

---

## How `wg0.conf` is managed

**Read this before touching anything.**

`wg0.conf` is a **generated artifact**, not a file you hand-edit. On every peer creation or revocation, `SyncWgConfig` renders the whole file from a Go template and atomically replaces it (`.tmp` + `rename`, mode `0600`).

What comes from where:

| Part of the file | Source |
| :--- | :--- |
| `Address`, `ListenPort` | hardcoded in the template |
| All `PostUp` / `PostDown` zone rules | hardcoded in the template |
| `PrivateKey` | **`WG_SERVER_PRIVATE_KEY` from the environment** |
| `MASQUERADE -o <iface>` | `WG_EGRESS_IFACE` (default `ens3`) |
| Every `[Peer]` block | the SQLite database (`GetActivePeers()`) |

Two consequences worth internalising:

**Hand edits do not survive.** Anything you add to the file is erased at the next sync. Change the template, not the file.

**A mismatched `WG_SERVER_PRIVATE_KEY` is a silent time bomb.** `SyncWgConfig` writes the file but does **not** reload the interface. If the environment holds a different key than the live tunnel, the file is quietly poisoned while everything keeps working — and the failure only surfaces at the next reboot, when `wg-quick` reads it and every client is rejected. If SSH is restricted to the VPN range, that means losing access to the box.

### Key coherence check

Run this whenever you change a key, and before restarting the service. All three lines must be identical:

```bash
sudo grep '^WG_SERVER_PRIVATE_KEY=' /etc/openward.env | cut -d= -f2- | wg pubkey
sudo grep '^PrivateKey' /etc/wireguard/wg0.conf | cut -d' ' -f3 | wg pubkey
sudo wg show wg0 public-key
```

---

## Setting up the WireGuard Gateway

### 1. Prerequisites

* A Linux Server (Ubuntu/Debian recommended) with a public IP.
* `wireguard-tools` and `iptables` installed.
* IP Forwarding enabled.

```bash
sudo modprobe wireguard
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-openward.conf
sudo sysctl -p /etc/sysctl.d/99-openward.conf
sudo apt-get install -y wireguard-tools iptables
```

Confirm your egress interface name with `ip -o link`. If it is not `ens3`, set `WG_EGRESS_IFACE`.

### 2. Generate server keys

```bash
umask 077
wg genkey | tee server.private | wg pubkey > server.public
openssl rand -base64 32          # APP_SECRET
```

Keep `server.private` somewhere safe and outside the repo. If the only copy of your private key ends up inside `wg0.conf`, a bad regeneration loses it permanently.

### 3. Bootstrap `wg0.conf`

You need a minimal config for the very first `wg-quick up`. The API replaces it entirely once it runs — zone rules and all — so keep this short:

```ini
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = <YOUR_SERVER_PRIVATE_KEY>
```

### 4. Start WireGuard

```bash
sudo systemctl enable --now wg-quick@wg0
sudo wg show
```

Once the API rewrites the file, apply changes without dropping the tunnel:

```bash
sudo wg syncconf wg0 <(wg-quick strip wg0)
```

### 5. Firewall

The API listens on `:4444`, on all interfaces. Restrict it to the tunnel — the dashboard has no business being reachable from the internet:

```bash
sudo ufw allow 51820/udp comment 'WireGuard'
sudo ufw allow from 10.200.200.0/24 to any port 4444 proto tcp comment 'OpenWard UI via WireGuard'
sudo ufw status numbered
```

Since the service binds `0.0.0.0`, this rule is the only thing keeping the dashboard private. Confirm it is in place before the first start.

---

## Building

The Go binary is cheap to build (~300 MB peak) and can be compiled on the Gateway. **The Next.js build is not** — it peaks around 1.5 GB, which will trip the OOM killer on a small VPS running other services. Build the frontend on a workstation and ship the output.

### Frontend

```bash
NEXT_PUBLIC_API_URL= make dist
grep -rl '127.0.0.1' dist/ || echo "clean"
```

> **The `NEXT_PUBLIC_API_URL=` prefix is not optional.** `make dist` reads `frontend/.env.local`, which holds the dev value `http://127.0.0.1:4444`. Next inlines `NEXT_PUBLIC_*` variables into the bundle **at build time**, so that value gets frozen into the JavaScript and every API call from the browser goes to the *visitor's own machine* instead of the Gateway. The requests simply hang, with no error anywhere. Leave the variable empty for a same-origin build — the Dockerfile already does this with `ENV NEXT_PUBLIC_API_URL=`.

The `grep` is the proof. If it prints file names, the build is poisoned — do not ship it.

Copy it to the Gateway:

```bash
scp -P <ssh_port> -r dist <user>@<gateway>:~/OpenWard/backend/
```

### Backend

On the Gateway:

```bash
cd ~/OpenWard/backend
go build -o openward ./src
```

---

## Running it

```bash
sudo systemctl enable --now openward
systemctl is-active openward
sudo journalctl -u openward -n 5 --no-pager
curl -s -o /dev/null -w '%{http_code}\n' http://10.200.200.1:4444/
```

Then confirm the generated config is what you expect:

```bash
sudo grep -c '^PostUp' /etc/wireguard/wg0.conf
sudo grep '^PrivateKey' /etc/wireguard/wg0.conf | cut -d' ' -f3 | wg pubkey
sudo wg show
```

### systemd unit

```ini
[Unit]
Description=OpenWard
After=wg-quick@wg0.service
Requires=wg-quick@wg0.service

[Service]
WorkingDirectory=/home/<user>/OpenWard/backend
EnvironmentFile=/etc/openward.env
ExecStart=/home/<user>/OpenWard/backend/openward
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`SERVE_DIR` and `DB_PATH` default to `./dist` and `./database.db`, both relative to `WorkingDirectory`.

---

## Docker (alternative)

`docker compose up -d` from the repo root. The compose file uses `network_mode: host`, `NET_ADMIN`, `/dev/net/tun`, and bind-mounts `/etc/wireguard` read-write.

Two things to know before choosing this route:

* The container runs as **root** and holds `NET_ADMIN` plus the host network namespace. It is not meaningfully isolated — a deliberate trade-off for a service whose job is reconfiguring the host's WireGuard interface.
* The compose file mounts a **named volume** at `/data`, so the container starts with an empty database. No peers means `wg0.conf` is regenerated with zero `[Peer]` blocks, which kills the tunnel at the next reload.

Point `WG_CONFIG_PATH` at a scratch file for a first run and diff the output against your live config before letting the container touch `/etc/wireguard`.

---

## Environment

Copy `.env.example` to `/etc/openward.env`. Production (`APP_ENV` not `dev`) refuses to start unless the WireGuard keys and endpoint parse.

| Variable | Required in production | Notes |
| :--- | :--- | :--- |
| `APP_SECRET` | yes, ≥32 bytes | JWT HMAC |
| `APP_ENV` | no | `dev` skips WG key checks and writes wg conf to a temp file |
| `ALLOW_INSECURE_LOCAL` | no | only with `APP_ENV=dev`: bypasses `RequireAdminIP` |
| `TRUSTED_PROXY` | no | if unset, `X-Forwarded-For` is ignored |
| `CORS_ORIGIN` | no | **dev-only**; comma-separated exact origins; unset in production |
| `DB_PATH` | no | default `./database.db` |
| `SERVE_DIR` | no | default `./dist` |
| `WG_SERVER_PRIVATE_KEY` | yes | must match the live interface — see the coherence check |
| `WG_SERVER_PUBLIC_KEY` | yes | same |
| `WG_SERVER_ENDPOINT` | yes | public `host:port` clients dial; UDP 51820 must be reachable |
| `WG_EGRESS_IFACE` | no | default `ens3`; NAT `-o` interface |
| `WG_CONFIG_PATH` | no | default `/etc/wireguard/wg0.conf` |
| `ADMIN_USERNAME` | first boot | seeds the first user; all three `ADMIN_*` required together |
| `ADMIN_EMAIL` | first boot | |
| `ADMIN_PASSWORD` | first boot | ≥12 characters; remove from the environment once the user exists |

---

## Bootstrapping the first admin peer

`RequireAdminIP` only accepts `10.200.200.2`–`.15`. Login and every admin API are blocked until an admin peer is connected from that range — and you need the API to create that peer. Seeding `ADMIN_*` creates a **user**, not a peer.

One-time sequence:

1. Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and start once so the users table is not empty.
2. Temporarily set `APP_ENV=dev` **and** `ALLOW_INSECURE_LOCAL=true`. Restart. A loud warning is printed. This is the only supported way to reach `POST /api/login` and `POST /api/createPeer` from outside the tunnel.
3. Log in, deploy a peer with network role `admin`. Import the client config and bring the tunnel up.
4. Unset both variables. Restart. Further API calls must come from that admin peer's VPN address.
5. Remove `ADMIN_PASSWORD` from the environment.

Never leave `ALLOW_INSECURE_LOCAL=true` on a publicly reachable address.

---

## Troubleshooting

| Symptom | Cause |
| :--- | :--- |
| Dashboard loads, requests hang, devtools shows `127.0.0.1:4444` | frontend built without `NEXT_PUBLIC_API_URL=` |
| Dashboard unreachable, TCP times out, ICMP works | no UFW rule for `4444` — check `journalctl -kf \| grep 4444` for `[UFW BLOCK]` |
| Every client fails after a reboot, nothing changed in between | `WG_SERVER_PRIVATE_KEY` did not match the live key when `SyncWgConfig` last ran |
| Login returns 403 | request is not coming from `10.200.200.2`–`.15` |
| Blank page, API 404s on known routes | frontend and binary built from different commits |
| Stale UI after copying a new `dist/` | browser cache — hard-refresh with `Ctrl+Shift+R` |

---

## Project Structure

* [`/backend`](./backend) — Go API, SQLite, runs on the Gateway and owns `wg0.conf`.
* [`/frontend`](./frontend) — Next.js dashboard, static export served by the Go binary.

*(See [`backend/README.md`](./backend/README.md) for API-level detail.)*
