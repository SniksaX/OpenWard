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
PostUp = /etc/wireguard/firewall.sh up %i
PostDown = /etc/wireguard/firewall.sh down %i

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
