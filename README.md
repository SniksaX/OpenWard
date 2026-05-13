# 🛡️ OpenWard Enterprise

**Zone-Based Zero Trust Network Access (ZTNA) built on WireGuard.**

OpenWard transforms a standard WireGuard VPN into a highly secure, stateful, and segmented Zero Trust enterprise network. By combining native WireGuard cryptography with strict `iptables` rules and an intuitive management dashboard, OpenWard isolates user traffic, prevents lateral malware movement, and allows you to manage network access seamlessly.

<img width="1806" height="865" alt="image" src="https://github.com/user-attachments/assets/73fd02ec-a6c7-4e7e-ae6f-6b8296a67df3" />
<img width="1768" height="759" alt="image" src="https://github.com/user-attachments/assets/62b57a9a-cd2e-4169-9b31-208f4514c3f3" />

---

## Overview

Standard VPNs often provide "flat" networks—once a user connects, they can ping and access any other device on the network. **OpenWard fixes this.** 

Instead of a flat topology, OpenWard assigns every provisioned identity (peer) to a specific **Access Zone** based on their allocated IP address. Strict `iptables` firewall rules are enforced at the network interface level to ensure that devices can only communicate with authorized endpoints. 

The project consists of three main parts:
1. **The WireGuard Gateway**: A Linux server running WireGuard and `iptables` that handles the actual traffic routing and firewalling.
2. **The Backend**: A Node.js/Express API that acts as an orchestrator. It securely connects to the WireGuard Gateway via SSH to read configs, allocate IPs, and provision/revoke peers without needing to install agents on the Gateway itself.
3. **The Frontend**: A beautiful Next.js dashboard providing a single pane of glass for identity provisioning, bandwidth monitoring, and zone management.

---

## Architecture & Access Zones

OpenWard uses a `/24` subnet (`10.200.200.0/24`), mathematically segmented into 6 distinct zones. The firewall rules act as a one-way mirror: humans can access servers (if permitted), but servers cannot initiate connections to humans (preventing malware/ransomware spread).

| Zone | IP Range | Capacity | Network Privileges & Restrictions |
| :--- | :--- | :--- | :--- |
|  **Admins** | `.2 - .15` | 14 | **Full Access.** Can access all servers and other devices. |
|  **Hidden Servers** | `.16 - .49` | 34 | **Isolated.** Accessible *only* by Admins. Cannot initiate outbound connections to any human devices. |
|  **Shared Servers** | `.50 - .99` | 50 | **Standard Access.** Accessible by Admins and Employees. Cannot initiate outbound connections to humans. |
|  **Employees** | `.100 - .149` | 50 | **Restricted.** Can access Shared Servers and the Internet. *Blocked* from reaching Admins, Hidden Servers, Guests, or other Employees. |
|  **Gamers** | `.150 - .199` | 50 | **Isolated Tier.** Can access the Internet and other Gamers. *Blocked* from Admins, Servers, Employees, and Guests. |
|  **Guests** | `.200 - .254` | 55 | **Internet Only.** Cannot initiate connections to *anything* inside the VPN subnet. |

---

## Setting up the WireGuard Gateway

Before running the frontend or backend, you must configure your Linux gateway server. OpenWard expects a very specific `wg0.conf` structure so the backend API can parse zones and inject new peers into the correct categories.

### 1. Prerequisites
* A Linux Server (Ubuntu/Debian recommended) with a public IP.
* `wireguard` and `iptables` installed.
* IP Forwarding enabled.

Enable IP Forwarding by running:
```bash
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.d/99-wireguard.conf
sudo sysctl -p /etc/sysctl.d/99-wireguard.conf
```

### 2. Configure WireGuard (`/etc/wireguard/wg0.conf`)
Create your WireGuard configuration file. **Do not remove the section headers (e.g., `# / 02-15 / #Admin`)!** The OpenWard backend relies on these exact string markers to inject new peers cleanly without breaking the file structure.

```ini
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = <YOUR_SERVER_PRIVATE_KEY>

# ---------------------------------------------------------
# FIREWALL RULES (Stateful Zero Trust Architecture)
# ---------------------------------------------------------

# 1. GUESTS (.200 - .254) -> Cannot initiate connections to ANYTHING inside the VPN
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.200-10.200.200.254 -d 10.200.200.0/24 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.200-10.200.200.254 -d 10.200.200.0/24 -m state --state NEW -j DROP

# 2. GAMERS (.150 - .199) -> Cannot initiate to Admins, Servers, Employees, or Guests.
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.2-10.200.200.149 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.200-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.2-10.200.200.149 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.200-10.200.200.254 -m state --state NEW -j DROP

# 3. EMPLOYEES (.100 - .149) -> Cannot initiate to Admins, Hidden Servers, or other Humans.
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.2-10.200.200.49 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.2-10.200.200.49 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP

# 4. SERVER PROTECTION (.16 - .99) -> Cannot initiate connections to humans (prevents malware spreading).
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.2-10.200.200.15 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.2-10.200.200.15 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP

# 5. NAT / INTERNET ACCESS -> Allows approved/reply traffic to hit the internet and pass through.
# NOTE: Replace 'ens3' with your server's actual public network interface (e.g., eth0)
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

# ---------------------------------------------------------
# PEERS
# ---------------------------------------------------------

# / 02-15 / #Admin

# / 16-49 / #Hidden servers

# / 50-99 / #Shared servers

# / 100-149 / #Employees

# / 150-199 / #Gamers

# / 200-254 / #Guests
```

*Note: You must ensure that the `ens3` interface in the NAT rules matches your server's actual default ethernet interface (check using `ip a`).*

### 3. Start WireGuard
Once the file is saved, enable and start the WireGuard service:
```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### 4. Create an SSH Key for the API (Important)
Because OpenWard's backend is entirely decoupled from the Gateway, it requires SSH access to run `wg` commands and modify the `wg0.conf` file.
1. Generate an Ed25519 SSH key pair.
2. Add the public key to the Gateway server's `~/.ssh/authorized_keys`.
3. Set up the Gateway server to allow the user (e.g., `server`) to execute `sudo wg` and `sudo iptables` without a password prompt.

---

##  Project Structure

*   [`/backend`](./backend) - Node.js/Express orchestration server. (Connects via SSH to modify the Gateway).
*   [`/frontend`](./frontend) - Next.js React Dashboard UI for managing the network.

*(Check the specific README files inside the `/frontend` and `/backend` directories for build and deployment instructions.)*
