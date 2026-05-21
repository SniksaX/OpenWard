package db

import (
	"database/sql"
	"errors"
	"fmt"
	"openward/src/types"
)

type PeersRepo struct {
	db *sql.DB
}

func (p *PeersRepo) CreateTable() error {
	query1 := `
		CREATE TABLE IF NOT EXISTS peers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			name VARCHAR(100) NOT NULL,
			ip_address VARCHAR(39) UNIQUE NOT NULL,
			public_key VARCHAR(44) UNIQUE NOT NULL,
			status VARCHAR(20) DEFAULT 'active',
			device_type VARCHAR(20) DEFAULT 'server',
			network_role VARCHAR(20) DEFAULT 'standard',
			last_handshake BIGINT DEFAULT 0,
			transfer_rx BIGINT DEFAULT 0,
			transfer_tx BIGINT DEFAULT 0,
			client_config TEXT,
			last_endpoint VARCHAR(100) DEFAULT '',
			allowed_ips VARCHAR(100) DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			revoked_at DATETIME
		)
	`
	if _, err := p.db.Exec(query1); err != nil {
		return err
	}

	query2 := `
		CREATE TABLE IF NOT EXISTS peer_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			public_key VARCHAR(44) NOT NULL,
			action VARCHAR(50) NOT NULL,
			details TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`
	_, err := p.db.Exec(query2)
	return err
}

func (p *PeersRepo) AddPeer(peer types.Peer) error {
	query := `
		INSERT INTO peers (
			user_id, name, ip_address, public_key, status, device_type,
			network_role, last_handshake, transfer_rx, transfer_tx, client_config
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := p.db.Exec(query,
		peer.UserID, peer.Name, peer.IPAddress, peer.PublicKey, peer.Status,
		peer.DeviceType, peer.NetworkRole, peer.LastHandshake,
		peer.TransferRX, peer.TransferTX, peer.ClientConfig)

	return err
}

func (p *PeersRepo) GetAvailableIP(role types.NetworkRole) (string, error) {
	var start, end int

	switch role {
	case types.RoleAdmin:
		start, end = 2, 15
	case types.RoleHiddenServer:
		start, end = 16, 49
	case types.RoleSharedServer:
		start, end = 50, 99
	case types.RoleEmployee:
		start, end = 100, 149
	case types.RoleGamer:
		start, end = 150, 199
	case types.RoleGuest:
		start, end = 200, 254
	default:
		return "", errors.New("invalid network role")
	}

	query := `SELECT ip_address FROM peers WHERE network_role = ? AND status != 'revoked'`
	rows, err := p.db.Query(query, role)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	usedIPs := make(map[string]bool)
	for rows.Next() {
		var ip string
		if err := rows.Scan(&ip); err != nil {
			return "", err
		}
		usedIPs[ip] = true
	}

	for i := start; i <= end; i++ {
		candidateIP := fmt.Sprintf("10.200.200.%d", i)
		if !usedIPs[candidateIP] {
			return candidateIP, nil
		}
	}

	return "", fmt.Errorf("the IP subnet for the role '%s' is completely full", role)
}

func (p *PeersRepo) GetActivePeers() ([]types.Peer, error) {
	query := `SELECT name, ip_address, public_key, network_role FROM peers WHERE status = 'active'`
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []types.Peer
	for rows.Next() {
		var peer types.Peer
		if err := rows.Scan(&peer.Name, &peer.IPAddress, &peer.PublicKey, &peer.NetworkRole); err != nil {
			return nil, err
		}
		peers = append(peers, peer)
	}
	return peers, nil
}

func (p *PeersRepo) GetPeersByUserID(userID int) ([]types.Peer, error) {
	query := `SELECT id, user_id, name, ip_address, public_key, status, device_type, network_role 
	          FROM peers WHERE user_id = ? ORDER BY created_at DESC`

	rows, err := p.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []types.Peer
	for rows.Next() {
		var peer types.Peer
		if err := rows.Scan(&peer.ID, &peer.UserID, &peer.Name, &peer.IPAddress, &peer.PublicKey, &peer.Status, &peer.DeviceType, &peer.NetworkRole); err != nil {
			return nil, err
		}
		peers = append(peers, peer)
	}
	return peers, nil
}

func (p *PeersRepo) RevokePeer(publicKey string) error {
	query := `UPDATE peers SET status = 'revoked' WHERE public_key = ?`
	_, err := p.db.Exec(query, publicKey)
	return err
}

func (p *PeersRepo) GetAllPeers() ([]types.Peer, error) {
	query := `SELECT id, user_id, name, ip_address, public_key, status, device_type, network_role, created_at 
	          FROM peers ORDER BY created_at DESC`

	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []types.Peer
	for rows.Next() {
		var peer types.Peer
		if err := rows.Scan(&peer.ID, &peer.UserID, &peer.Name, &peer.IPAddress, &peer.PublicKey, &peer.Status, &peer.DeviceType, &peer.NetworkRole, &peer.CreatedAt); err != nil {
			return nil, err
		}
		peers = append(peers, peer)
	}
	return peers, nil
}

func (p *PeersRepo) GetPeerByIP(ip string) (*types.PeerClaim, error) {
	query := `SELECT id, user_id, ip_address FROM peers WHERE ip_address = ? AND status = 'active' LIMIT 1`

	var claim types.PeerClaim
	var userID sql.NullInt64

	err := p.db.QueryRow(query, ip).Scan(&claim.ID, &userID, &claim.IPAddress)
	if err != nil {
		return nil, err
	}

	if userID.Valid {
		v := int(userID.Int64)
		claim.UserID = &v
	}

	return &claim, nil
}

func (p *PeersRepo) ClaimPeer(tx *sql.Tx, peerID, userID int) error {
	query := `UPDATE peers SET user_id = ? WHERE id = ? AND user_id IS NULL`
	res, err := tx.Exec(query, userID, peerID)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("peer is already claimed or does not exist")
	}
	return nil
}

func (p *PeersRepo) GetPeerConfig(publicKey string) (string, error) {
	query := `SELECT client_config FROM peers WHERE public_key = ?`

	var config sql.NullString

	err := p.db.QueryRow(query, publicKey).Scan(&config)
	if err != nil {
		return "", err
	}

	return config.String, nil
}
