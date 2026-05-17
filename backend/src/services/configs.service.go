package services

import (
	"bytes"
	"fmt"
	"os"
	"text/template"

	"openward/src/db"
	"openward/src/types"
)

type wgTemplateData struct {
	ServerPrivateKey string
	Admins           []types.Peer
	HiddenServers    []types.Peer
	SharedServers    []types.Peer
	Employees        []types.Peer
	Gamers           []types.Peer
	Guests           []types.Peer
}

const wgConfTemplate = `[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = {{.ServerPrivateKey}}

PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.200-10.200.200.254 -d 10.200.200.0/24 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.2-10.200.200.149 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.200-10.200.200.254 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.2-10.200.200.49 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.2-10.200.200.15 -m state --state NEW -j DROP
PostUp = iptables -I FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostUp = iptables -A FORWARD -i %i -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE

PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.200-10.200.200.254 -d 10.200.200.0/24 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.2-10.200.200.149 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.150-10.200.200.199 -m iprange --dst-range 10.200.200.200-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.2-10.200.200.49 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.100-10.200.200.149 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.2-10.200.200.15 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -m iprange --src-range 10.200.200.16-10.200.200.99 -m iprange --dst-range 10.200.200.100-10.200.200.254 -m state --state NEW -j DROP
PostDown = iptables -D FORWARD -i %i -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

# ---------------------------------------------------------
# PEERS
# ---------------------------------------------------------

# / 02-15 / #Admin
{{range .Admins}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}

# / 16-49 / #Hidden servers
{{range .HiddenServers}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}

# / 50-99 / #Shared servers
{{range .SharedServers}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}

# / 100-149 / #Employees
{{range .Employees}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}

# / 150-199 / #Gamers
{{range .Gamers}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}

# / 200-254 / #Guests
{{range .Guests}}
# --- {{.Name}} ---
[Peer]
PublicKey = {{.PublicKey}}
AllowedIPs = {{.IPAddress}}/32
{{end}}
`

func SyncWgConfig(repo *db.PeersRepo) error {
	peers, err := repo.GetActivePeers()
	if err != nil {
		return fmt.Errorf("failed to fetch peers for config: %v", err)
	}

	data := wgTemplateData{
		ServerPrivateKey: os.Getenv("WG_SERVER_PRIVATE_KEY"),
	}

	for _, p := range peers {
		switch p.NetworkRole {
		case types.RoleAdmin:
			data.Admins = append(data.Admins, p)
		case types.RoleHiddenServer:
			data.HiddenServers = append(data.HiddenServers, p)
		case types.RoleSharedServer:
			data.SharedServers = append(data.SharedServers, p)
		case types.RoleEmployee:
			data.Employees = append(data.Employees, p)
		case types.RoleGamer:
			data.Gamers = append(data.Gamers, p)
		case types.RoleGuest:
			data.Guests = append(data.Guests, p)
		}
	}

	tmpl, err := template.New("wg0").Parse(wgConfTemplate)
	if err != nil {
		return fmt.Errorf("failed to parse template: %v", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return fmt.Errorf("failed to execute template: %v", err)
	}

	targetFile := "/etc/wireguard/wg0.conf"

	if os.Getenv("APP_ENV") == "dev" {
		fmt.Println("[DEV MODE] Writing config to local file:", targetFile)
	}

	tmpFile := targetFile + ".tmp"

	err = os.WriteFile(tmpFile, buf.Bytes(), 0600)
	if err != nil {
		return fmt.Errorf("failed to write tmp config file: %v", err)
	}

	err = os.Rename(tmpFile, targetFile)
	if err != nil {
		return fmt.Errorf("failed to replace config file: %v", err)
	}

	return nil
}
