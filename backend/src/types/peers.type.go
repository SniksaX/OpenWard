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
	UserID        int         `json:"user_id"`
	IPAddress     string      `json:"ip_address"`
	PublicKey     string      `json:"public_key"`
	Status        string      `json:"status"`
	DeviceType    DeviceType  `json:"device_type"`
	NetworkRole   NetworkRole `json:"network_role"`
	LastHandshake int64       `json:"last_handshake"`
	TransferRX    uint64      `json:"transfer_rx"`
	TransferTX    uint64      `json:"transfer_tx"`
	ClientConfig  string      `json:"-"`
	LastEndpoint  string      `json:"last_endpoint"`
	AllowedIPs    string      `json:"allowed_ips"`
	CreatedAt     time.Time   `json:"created_at"`
	RevokedAt     *time.Time  `json:"revoked_at"`
}

type LivePeerStats struct {
	PublicKey     string  `json:"public_key"`
	Endpoint      string  `json:"endpoint"`
	LastHandshake int64   `json:"last_handshake"`
	TransferRX    uint64  `json:"transfer_rx"`
	TransferTX    uint64  `json:"transfer_tx"`
	IsOnline      bool    `json:"is_online"`
	LatencyMs     float64 `json:"latency_ms"`
}

type ConfigurePeer struct {
	Name     string      `json:"name"`
	AllowIPS string      `json:"allow_ips"`
	Role     NetworkRole `json:"role"`
}

type CreatePeer struct {
	Name        string      `json:"name"`
	UserID      int         `json:"user_id"`
	Passphrase  string      `json:"passphrase"`
	UseAdguard  bool        `json:"use_adguard"`
	FullTunnel  bool        `json:"full_tunnel"`
	DeviceType  DeviceType  `json:"device_type"`
	NetworkRole NetworkRole `json:"network_role"`
}

type PeerEvent struct {
	ID        int       `json:"id"`
	PublicKey string    `json:"public_key"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"created_at"`
}
