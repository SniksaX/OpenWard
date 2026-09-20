# OpenWard backend

Go API (`module openward`) using `database/sql` + SQLite and `net/http` ServeMux.

The API serves the Next.js static export from `SERVE_DIR` (default `./dist`).
From the repo root, `make dist` builds `frontend/` and copies it to `./dist`.
In Docker the frontend is built in a Node stage and copied to `/app/dist`.

## Deployment

### Prerequisites

On the host (compose uses `network_mode: host` plus `/dev/net/tun` and `NET_ADMIN`):

```bash
# WireGuard kernel module
sudo modprobe wireguard
lsmod | grep wireguard

# IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-openward.conf

# Userspace tools (wg-quick applies PostUp iptables in wg0.conf)
sudo apt-get install -y wireguard-tools iptables
```

Create `wg0` once the API has written `/etc/wireguard/wg0.conf` (or after you
drop a bootstrap conf there):

```bash
sudo wg-quick up wg0
# later, after the API rewrites the file:
sudo wg syncconf wg0 <(wg-quick strip wg0)
```

Confirm the egress NIC name (`ip -o link`) and set `WG_EGRESS_IFACE` if it is
not `ens3`.

### Key generation

```bash
umask 077
wg genkey | tee server.private | wg pubkey > server.public
# APP_SECRET: at least 32 random bytes
openssl rand -base64 32
```

`WG_SERVER_ENDPOINT` is the **public** `host:port` clients dial, usually
`your.server.example:51820` (UDP 51820 must be reachable).

### Environment

Copy `.env.example` to `.env` on the host. Production (`APP_ENV` not `dev`)
refuses to start unless WireGuard keys and endpoint parse.

| Variable | Required in production | Notes |
| --- | --- | --- |
| `APP_SECRET` | yes, ≥32 bytes | JWT HMAC |
| `APP_ENV` | no | `dev` skips WG key checks and writes wg conf to a temp file |
| `ALLOW_INSECURE_LOCAL` | no | only with `APP_ENV=dev`: bypasses RequireAdminIP |
| `TRUSTED_PROXY` | no | if unset, `X-Forwarded-For` is ignored |
| `CORS_ORIGIN` | no | **dev-only**; comma-separated exact origins; unset in production |
| `DB_PATH` | no | default `./database.db`; compose uses `/data/database.db` |
| `SERVE_DIR` | no | default `./dist`; compose uses `/app/dist` |
| `WG_SERVER_PRIVATE_KEY` | yes | `wgtypes.ParseKey` |
| `WG_SERVER_PUBLIC_KEY` | yes | `wgtypes.ParseKey` |
| `WG_SERVER_ENDPOINT` | yes | `host:port` |
| `WG_EGRESS_IFACE` | no | default `ens3`; NAT `-o` interface |
| `WG_CONFIG_PATH` | no | default `/etc/wireguard/wg0.conf` |
| `ADMIN_USERNAME` | first boot | seed first user; all three ADMIN_* required together |
| `ADMIN_EMAIL` | first boot | |
| `ADMIN_PASSWORD` | first boot | ≥12 characters |
| `NEXT_PUBLIC_API_URL` | frontend **dev** only | leave empty in the Docker frontend build (same-origin) |

### Bootstrap the first admin peer

`RequireAdminIP` allows only `10.200.200.2`–`10.200.200.15`. Login and every
admin API are blocked until a WireGuard **admin** peer is connected from that
range. Seeding `ADMIN_*` creates a **user**, not a peer — it is not enough by
itself.

Recommended one-time sequence:

1. Set `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and start once so the
   users table is not empty.
2. Temporarily set `APP_ENV=dev` **and** `ALLOW_INSECURE_LOCAL=true`. Restart.
   You will see a loud warning. This is the only supported way to reach
   `POST /api/login` and `POST /api/createPeer` from outside the tunnel.
3. Log in, deploy a peer with network role `admin` (that lands in
   `10.200.200.2`–`.15`). Import the client config and bring the tunnel up.
4. Unset `ALLOW_INSECURE_LOCAL` and `APP_ENV=dev`. Restart. Further API calls
   must come from that admin peer's VPN address.
5. Remove `ADMIN_PASSWORD` from the environment after the user exists.

Do not leave `ALLOW_INSECURE_LOCAL=true` on a public address.

### Docker

From the repo root (build context is the whole repo so the Node stage can see
`frontend/`):

```bash
docker compose build
docker compose up -d
```

`make dist` is the non-Docker equivalent: Node build, then copy to `./dist`
and run the Go binary with default `SERVE_DIR=./dist`.

## Upgrading

Databases created before the `peers.user_id` foreign key was added are **not**
migrated by `CREATE TABLE IF NOT EXISTS`. Recreate the file:

```bash
# stop the API first
rm -f database.db database.db-wal database.db-shm
# or, if using a custom path:
rm -f "$DB_PATH" "$DB_PATH"-wal "$DB_PATH"-shm
```

Then start the server again so it recreates `users` and `peers` (with
`REFERENCES users(id) ON DELETE SET NULL`) and optionally seeds the bootstrap
admin from `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
