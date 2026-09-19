package db

import (
	"database/sql"
	"path/filepath"
	"testing"

	"openward/src/types"
)

func TestPeerUserIDForeignKey(t *testing.T) {
	t.Setenv("DB_PATH", filepath.Join(t.TempDir(), "fk.db"))
	app, err := InitDB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = app.SQL.Close() })
	if err := app.Users.CreateTable(); err != nil {
		t.Fatal(err)
	}
	if err := app.Peers.CreateTable(); err != nil {
		t.Fatal(err)
	}

	var fkCount int
	if err := app.SQL.QueryRow(`SELECT COUNT(*) FROM pragma_foreign_key_list('peers')`).Scan(&fkCount); err != nil {
		t.Fatal(err)
	}
	if fkCount != 1 {
		t.Fatalf("expected 1 FK on peers, got %d", fkCount)
	}

	badID := 999
	err = app.Peers.AddPeer(types.Peer{
		UserID:      &badID,
		Name:        "orphan",
		IPAddress:   "10.200.200.200",
		PublicKey:   "pk-fk-bad-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=",
		Status:      "active",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	})
	if err == nil {
		t.Fatal("expected FK violation for unknown user_id")
	}

	if err := app.Users.InsertUser(types.UserCred{
		Username: "alice",
		Email:    "alice@ow.net",
		Password: "not-a-real-hash-but-long-enough-ok",
		Role:     "standard",
	}); err != nil {
		t.Fatal(err)
	}
	var uid int
	if err := app.SQL.QueryRow(`SELECT id FROM users WHERE email = ?`, "alice@ow.net").Scan(&uid); err != nil {
		t.Fatal(err)
	}

	if err := app.Peers.AddPeer(types.Peer{
		UserID:      &uid,
		Name:        "claimed",
		IPAddress:   "10.200.200.201",
		PublicKey:   "pk-fk-ok-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=",
		Status:      "active",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	}); err != nil {
		t.Fatal(err)
	}

	if _, err := app.SQL.Exec(`DELETE FROM users WHERE id = ?`, uid); err != nil {
		t.Fatal(err)
	}

	var userID sql.NullInt64
	if err := app.SQL.QueryRow(`SELECT user_id FROM peers WHERE name = 'claimed'`).Scan(&userID); err != nil {
		t.Fatal(err)
	}
	if userID.Valid {
		t.Fatalf("ON DELETE SET NULL failed, user_id=%d", userID.Int64)
	}
}

func TestCreateTableDoesNotMigrateExistingPeers(t *testing.T) {
	path := filepath.Join(t.TempDir(), "old.db")
	conn, err := sql.Open("sqlite3", path+"?_foreign_keys=on")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	if _, err := conn.Exec(`CREATE TABLE peers (id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT, ip_address TEXT UNIQUE, public_key TEXT UNIQUE)`); err != nil {
		t.Fatal(err)
	}

	repo := &PeersRepo{db: conn}
	if err := repo.CreateTable(); err != nil {
		t.Fatal(err)
	}

	var fkCount int
	if err := conn.QueryRow(`SELECT COUNT(*) FROM pragma_foreign_key_list('peers')`).Scan(&fkCount); err != nil {
		t.Fatal(err)
	}
	if fkCount != 0 {
		t.Fatalf("CREATE TABLE IF NOT EXISTS must not alter an existing table, fkCount=%d", fkCount)
	}
}
