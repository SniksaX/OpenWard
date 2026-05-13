package db

import (
	"database/sql"
	"openward/src/types"
)

type PeersRepo struct {
	db *sql.DB
}

func (p *PeersRepo) CreateTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS peers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(100) NOT NULL,
			ip_address VARCHAR(39) UNIQUE NOT NULL,
			public_key VARCHAR(44) UNIQUE NOT NULL,
			status VARCHAR(20) DEFAULT 'active',
			device_type VARCHAR(20) DEFAULT 'server',
			network_role VARCHAR(20) DEFAULT 'standard',
			last_handshake BIGINT DEFAULT 0,
			transfer_rx BIGINT DEFAULT 0,
			transfer_tx BIGINT DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`
	_, err := p.db.Exec(query)
	return err
}

func (p *PeersRepo) AddPeer(peer types.Peer) error {
	query := `
		INSERT INTO peers (
			name, ip_address, public_key, status, device_type,
			network_role, last_handshake, transfer_rx, transfer_tx
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	if _, err := p.db.Exec(query,
		peer.Name, peer.IPAddress, peer.PublicKey, peer.Status,
		peer.DeviceType, peer.NetworkRole, peer.LastHandshake,
		peer.TransferRX, peer.TransferTX); err != nil {
		return err
	}
	return nil
}
