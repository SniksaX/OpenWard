// src/db/database.ts
import { Database } from "bun:sqlite";
import type { Peer } from "../types";

const db = new Database("openward.db");

export const initDb = (): void => {
  db.run(`
        CREATE TABLE IF NOT EXISTS peers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip_address TEXT UNIQUE NOT NULL,
            public_key TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'active',
            device_type TEXT DEFAULT 'server',
            network_role TEXT DEFAULT 'standard',
            last_handshake INTEGER DEFAULT 0,
            transfer_rx INTEGER DEFAULT 0,
            transfer_tx INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  try {
    db.run(`ALTER TABLE peers ADD COLUMN network_role TEXT DEFAULT 'standard'`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
      console.error(err.message);
    }
  }

  db.run(`
        CREATE TABLE IF NOT EXISTS peer_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            peer_public_key TEXT NOT NULL,
            action TEXT NOT NULL,
            config_snapshot TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

export const addPeerRecord = (name: string, ipAddress: string, publicKey: string, deviceType: string = 'server', networkRole: string = 'standard'): void => {
  const insert = db.prepare(`
        INSERT OR IGNORE INTO peers (name, ip_address, public_key, device_type, network_role, status)
        VALUES (?, ?, ?, ?, ?, 'active')
    `);
  insert.run(name, ipAddress, publicKey, deviceType, networkRole);
};

export const addPeerHistory = (publicKey: string, action: string, configSnapshot: string = ''): void => {
  const insert = db.prepare(`
        INSERT INTO peer_history (peer_public_key, action, config_snapshot)
        VALUES (?, ?, ?)
    `);
  insert.run(publicKey, action, configSnapshot);
};

export const updatePeerStatus = (publicKey: string, status: string): void => {
  const update = db.prepare(`UPDATE peers SET status = ? WHERE public_key = ?`);
  update.run(status, publicKey);
};

export const updatePeerDetails = (publicKey: string, name: string, deviceType: string, networkRole: string): void => {
  const update = db.prepare(`
        UPDATE peers 
        SET name = ?, device_type = ?, network_role = ?
        WHERE public_key = ?
    `);
  update.run(name, deviceType, networkRole, publicKey);
};

export const updatePeerStats = (publicKey: string, lastHandshake: number, rx: number, tx: number, endpoint: string): void => {
  const update = db.prepare(`
        UPDATE peers 
        SET last_handshake = ?, transfer_rx = ?, transfer_tx = ?
        WHERE public_key = ?
    `);
  update.run(lastHandshake, rx, tx, publicKey);
};

export const getPeers = (): Peer[] => {
  const query = db.query(`SELECT * FROM peers ORDER BY created_at DESC`);
  return query.all() as Peer[];
};

export const revokePeerRecord = (publicKey: string): void => {
  updatePeerStatus(publicKey, 'revoked');
  addPeerHistory(publicKey, 'revoked');
};