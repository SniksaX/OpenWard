package services

import (
	"errors"
	"fmt"
	"openward/src/db"
	"openward/src/types"
)

func CreatePeer(req types.CreatePeer, passphrase string, peerRepo *db.PeersRepo) (string, error) {

	// --- PART 1: WIREGUARD & SSH LOGIC (To be built) ---

	// TODO: Ask WireguardService for an available IP based on req.NetworkRole
	allocatedIP := "10.200.200.5"

	// TODO: Ask SSHService to generate keys
	privateKey := "mock_private_key_xyz"
	publicKey := "mock_public_key_xyz"

	// TODO: Ask SSHService to append to config and apply seamlessly
	// err := wgService.ApplyPeer(...)
	// if err != nil { return "", err }

	newPeer := types.Peer{
		Name:        req.Name,
		IPAddress:   allocatedIP,
		PublicKey:   publicKey,
		Status:      "active",
		DeviceType:  req.DeviceType,
		NetworkRole: req.NetworkRole,
	}

	err := peerRepo.AddPeer(newPeer)
	if err != nil {
		return "", errors.New("failed to save peer to database: " + err.Error())
	}

	dnsString := "1.1.1.1, 1.0.0.1"
	if req.UseAdguard {
		dnsString = "10.200.200.1" // TODO: Read from an env config later
	}

	allowedIpsString := "10.200.200.0/24"
	if req.FullTunnel {
		allowedIpsString = "0.0.0.0/0, ::/0"
	}

	clientConfig := fmt.Sprintf(`[Interface]
		PrivateKey = %s
		Address = %s/24
		DNS = %s

		[Peer]
		PublicKey = <SERVER_PUBLIC_KEY_HERE>
		Endpoint = <SERVER_ENDPOINT_HERE>:51820
		AllowedIPs = %s
		PersistentKeepalive = 25`, privateKey, allocatedIP, dnsString, allowedIpsString)

	return clientConfig, nil
}
