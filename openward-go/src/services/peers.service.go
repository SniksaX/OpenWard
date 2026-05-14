package services

import (
	"fmt"
	"net"
	"os"
	"time"

	"openward/src/db"
	"openward/src/types"

	"golang.zx2c4.com/wireguard/wgctrl"
	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

type PeerService struct {
	Repo *db.PeersRepo
}

func NewPeerService(repo *db.PeersRepo) *PeerService {
	return &PeerService{Repo: repo}
}

func (s *PeerService) CreatePeer(req types.CreatePeer, passphrase string) (string, error) {

	allocatedIP, err := s.Repo.GetAvailableIP(req.NetworkRole)
	if err != nil {
		return "", fmt.Errorf("failed to allocate IP: %v", err)
	}

	privateKey, err := wgtypes.GeneratePrivateKey()
	if err != nil {
		return "", fmt.Errorf("failed to generate private key: %v", err)
	}
	publicKey := privateKey.PublicKey()

	if os.Getenv("APP_ENV") == "dev" {
		fmt.Printf("[DEV MODE] Skipping kernel wgctrl update for peer: %s\n", req.Name)
	} else {
		err = s.applyPeerLive("wg0", publicKey, allocatedIP)
		if err != nil {
			return "", fmt.Errorf("failed to apply peer to live interface: %v", err)
		}
	}

	newPeer := types.Peer{
		UserID:        req.UserID,
		Name:          req.Name,
		IPAddress:     allocatedIP,
		PublicKey:     publicKey.String(),
		Status:        "active",
		DeviceType:    req.DeviceType,
		NetworkRole:   req.NetworkRole,
		LastHandshake: 0,
		TransferRX:    0,
		TransferTX:    0,
		CreatedAt:     time.Now(),
	}

	err = s.Repo.AddPeer(newPeer)
	if err != nil {
		return "", fmt.Errorf("failed to save peer to database: %v", err)
	}

	err = SyncWgConfig(s.Repo)
	if err != nil {
		fmt.Printf("Warning: Live peer added, but config sync failed: %v\n", err)
	}

	dnsString := "1.1.1.1, 1.0.0.1"
	if req.UseAdguard {
		dnsString = "10.200.200.1"
	}

	allowedIpsString := "10.200.200.0/24"
	if req.FullTunnel {
		allowedIpsString = "0.0.0.0/0, ::/0"
	}

	serverPublicKey := os.Getenv("WG_SERVER_PUBLIC_KEY")
	serverEndpoint := os.Getenv("WG_SERVER_ENDPOINT")

	clientConfig := fmt.Sprintf(`[Interface]
PrivateKey = %s
Address = %s/24
DNS = %s

[Peer]
PublicKey = %s
Endpoint = %s
AllowedIPs = %s
PersistentKeepalive = 25`, privateKey.String(), allocatedIP, dnsString, serverPublicKey, serverEndpoint, allowedIpsString)

	return clientConfig, nil
}

func (s *PeerService) applyPeerLive(interfaceName string, pubKey wgtypes.Key, allowedIP string) error {
	client, err := wgctrl.New()
	if err != nil {
		return fmt.Errorf("failed to open wgctrl: %v", err)
	}
	defer client.Close()

	_, ipNet, err := net.ParseCIDR(allowedIP + "/32")
	if err != nil {
		return fmt.Errorf("invalid IP format: %v", err)
	}

	peerConfig := wgtypes.PeerConfig{
		PublicKey:         pubKey,
		AllowedIPs:        []net.IPNet{*ipNet},
		ReplaceAllowedIPs: true,
	}

	deviceConfig := wgtypes.Config{
		Peers: []wgtypes.PeerConfig{peerConfig},
	}

	return client.ConfigureDevice(interfaceName, deviceConfig)
}

func (s *PeerService) GetLiveStats() ([]types.LivePeerStats, error) {
	var liveStats []types.LivePeerStats

	if os.Getenv("APP_ENV") == "dev" {

		now := time.Now().Unix()
		mockRX := uint64(1000000 + (now%10)*50000)
		mockTX := uint64(2000000 + (now%10)*80000)

		liveStats = append(liveStats, types.LivePeerStats{
			PublicKey:     "mock_public_key_for_dev_mode=",
			Endpoint:      "203.0.113.5:51820",
			LastHandshake: now - 5,
			TransferRX:    mockRX,
			TransferTX:    mockTX,
		})
		return liveStats, nil
	}

	client, err := wgctrl.New()
	if err != nil {
		return nil, fmt.Errorf("failed to open kernel wgctrl: %v", err)
	}
	defer client.Close()

	device, err := client.Device("wg0")
	if err != nil {
		return nil, fmt.Errorf("failed to get wg0 device: %v", err)
	}

	for _, p := range device.Peers {
		endpoint := ""
		if p.Endpoint != nil {
			endpoint = p.Endpoint.String()
		}

		var lastHandshakeUnix int64 = 0
		if !p.LastHandshakeTime.IsZero() {
			lastHandshakeUnix = p.LastHandshakeTime.Unix()
		}

		stat := types.LivePeerStats{
			PublicKey:     p.PublicKey.String(),
			Endpoint:      endpoint,
			LastHandshake: lastHandshakeUnix,
			TransferRX:    uint64(p.ReceiveBytes),
			TransferTX:    uint64(p.TransmitBytes),
		}

		liveStats = append(liveStats, stat)
	}

	return liveStats, nil
}

func (s *PeerService) RevokePeer(publicKey string) error {
	err := s.Repo.RevokePeer(publicKey)
	if err != nil {
		return fmt.Errorf("failed to revoke peer in database: %v", err)
	}

	if os.Getenv("APP_ENV") == "dev" {
		fmt.Printf("[DEV MODE] Skipping kernel removal for peer: %s\n", publicKey)
	} else {
		err = s.removePeerLive("wg0", publicKey)
		if err != nil {
			return fmt.Errorf("failed to remove peer from live kernel: %v", err)
		}
	}

	err = SyncWgConfig(s.Repo)
	if err != nil {
		fmt.Printf("Warning: Peer revoked, but config sync failed: %v\n", err)
	}

	return nil
}

func (s *PeerService) removePeerLive(interfaceName string, pubKeyStr string) error {
	client, err := wgctrl.New()
	if err != nil {
		return err
	}
	defer client.Close()

	pubKey, err := wgtypes.ParseKey(pubKeyStr)
	if err != nil {
		return err
	}

	peerConfig := wgtypes.PeerConfig{
		PublicKey: pubKey,
		Remove:    true,
	}

	deviceConfig := wgtypes.Config{
		Peers: []wgtypes.PeerConfig{peerConfig},
	}

	return client.ConfigureDevice(interfaceName, deviceConfig)
}
