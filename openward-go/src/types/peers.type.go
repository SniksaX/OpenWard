package types

import "time"

type NetworkRole string

const (
	RoleAdmin        NetworkRole = "admin"
	RoleHiddenServer NetworkRole = "hidden_server"
	RoleSharedServer NetworkRole = "shared_server"
	RoleEmployee     NetworkRole = "employee"
	RoleGamer        NetworkRole = "gamer"
	RoleGuest        NetworkRole = "guest"
)

type DeviceType string

const (
	Server  DeviceType = "server"
	Mobile  DeviceType = "mobile"
	Desktop DeviceType = "desktop"
)

type Peer struct {
	ID            int         `json:"id"`
	Name          string      `json:"name"`
	IPAddress     string      `json:"ip_address"`
	PublicKey     string      `json:"public_key"`
	Status        string      `json:"status"`
	DeviceType    DeviceType  `json:"device_type"`
	NetworkRole   NetworkRole `json:"network_role"`
	LastHandshake int64       `json:"last_handshake"`
	TransferRX    uint64      `json:"transfer_rx"`
	TransferTX    uint64      `json:"transfer_tx"`
	CreatedAt     time.Time   `json:"created_at"`
}

type LivePeerStats struct {
	PublicKey     string `json:"public_key"`
	Endpoint      string `json:"endpoint"`
	LastHandshake int64  `json:"last_handshake"`
	TransferRX    uint64 `json:"transfer_rx"`
	TransferTX    uint64 `json:"transfer_tx"`
}

type ConfigurePeer struct {
	Name     string      `json:"name"`
	AllowIPS string      `json:"allow_ips"`
	Role     NetworkRole `json:"role"`
}

type CreatePeer struct {
	Name        string      `json:"name"`
	Passphrase  string      `json:"passphrase"`
	UseAdguard  bool        `json:"use_adguard"`
	FullTunnel  bool        `json:"full_tunnel"`
	DeviceType  DeviceType  `json:"device_type"`
	NetworkRole NetworkRole `json:"network_role"`
}
