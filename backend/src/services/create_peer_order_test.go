package services

import (
	"database/sql"
	"os"
	"strings"
	"testing"

	"openward/src/db"
	"openward/src/types"

	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

func setupPeerService(t *testing.T) (*PeerService, *sql.DB) {
	t.Helper()
	dir := t.TempDir()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(wd) })

	app, err := db.InitDB()
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
	return NewPeerService(app.Peers), app.SQL
}

func TestCreatePeerRollsBackDBWhenKernelApplyFails(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	svc, _ := setupPeerService(t)

	_, err := svc.CreatePeer(types.CreatePeer{
		Name:        "orphan-check",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	}, "")
	if err == nil {
		t.Fatal("expected kernel apply to fail without wg0")
	}
	if !strings.Contains(err.Error(), "live interface") {
		t.Fatalf("expected kernel apply error, got: %v", err)
	}

	peers, listErr := svc.Repo.GetAllPeers()
	if listErr != nil {
		t.Fatal(listErr)
	}
	if len(peers) != 0 {
		t.Fatalf("orphan peer row(s) left after kernel failure: %d", len(peers))
	}
}

func TestRevokePeerLeavesDBWhenKernelRemoveFails(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	svc, _ := setupPeerService(t)

	key, err := wgtypes.GeneratePrivateKey()
	if err != nil {
		t.Fatal(err)
	}
	pub := key.PublicKey().String()

	err = svc.Repo.AddPeer(types.Peer{
		Name:        "still-live",
		IPAddress:   "10.200.200.200",
		PublicKey:   pub,
		Status:      "active",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	})
	if err != nil {
		t.Fatal(err)
	}

	err = svc.RevokePeer(pub)
	if err == nil {
		t.Fatal("expected kernel removal to fail without wg0")
	}

	peers, listErr := svc.Repo.GetAllPeers()
	if listErr != nil {
		t.Fatal(listErr)
	}
	if len(peers) != 1 {
		t.Fatalf("expected 1 peer row, got %d", len(peers))
	}
	if peers[0].Status != "active" {
		t.Fatalf("peer marked %q while kernel removal failed", peers[0].Status)
	}
}

func TestRevokePeerNullsClientConfig(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", t.TempDir()+"/wg0.conf")
	svc, sqlDB := setupPeerService(t)

	key, err := wgtypes.GeneratePrivateKey()
	if err != nil {
		t.Fatal(err)
	}
	pub := key.PublicKey().String()
	if err := svc.Repo.AddPeer(types.Peer{
		Name:         "has-secret",
		IPAddress:    "10.200.200.200",
		PublicKey:    pub,
		Status:       "active",
		DeviceType:   types.Desktop,
		NetworkRole:  types.RoleGuest,
		ClientConfig: "[Interface]\nPrivateKey = SECRETKEY",
	}); err != nil {
		t.Fatal(err)
	}

	if err := svc.RevokePeer(pub); err != nil {
		t.Fatal(err)
	}

	var cfg sql.NullString
	if err := sqlDB.QueryRow(`SELECT client_config FROM peers WHERE public_key = ?`, pub).Scan(&cfg); err != nil {
		t.Fatal(err)
	}
	if cfg.Valid {
		t.Fatalf("client_config still set: %q", cfg.String)
	}

	_, err = svc.GetPeerConfigString(pub)
	if err == nil || !strings.Contains(err.Error(), "no config was stored") {
		t.Fatalf("expected no config stored error, got %v", err)
	}
}

func TestCreatePeerValidationRejectsBeforeWrite(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", t.TempDir()+"/wg0.conf")
	svc, sqlDB := setupPeerService(t)

	assertRejected := func(req types.CreatePeer) {
		t.Helper()
		_, err := svc.CreatePeer(req, "")
		if err == nil {
			t.Fatal("expected validation error")
		}
		var n int
		if err := sqlDB.QueryRow(`SELECT COUNT(*) FROM peers`).Scan(&n); err != nil {
			t.Fatal(err)
		}
		if n != 0 {
			t.Fatalf("validation must not write peers, got %d rows", n)
		}
	}

	assertRejected(types.CreatePeer{Name: "", DeviceType: types.Desktop, NetworkRole: types.RoleGuest})
	assertRejected(types.CreatePeer{Name: strings.Repeat("a", 101), DeviceType: types.Desktop, NetworkRole: types.RoleGuest})
	assertRejected(types.CreatePeer{Name: "ok", DeviceType: types.Desktop, NetworkRole: "bogus"})
}

func TestCreateAndRevokeWritePeerEvents(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", t.TempDir()+"/wg0.conf")
	svc, sqlDB := setupPeerService(t)

	cfg, err := svc.CreatePeer(types.CreatePeer{
		Name:        "evt-peer",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	}, "")
	if err != nil {
		t.Fatal(err)
	}
	if cfg == "" {
		t.Fatal("expected client config")
	}

	peers, err := svc.Repo.GetAllPeers()
	if err != nil || len(peers) != 1 {
		t.Fatalf("peers=%v err=%v", peers, err)
	}
	if err := svc.RevokePeer(peers[0].PublicKey); err != nil {
		t.Fatal(err)
	}

	var n int
	if err := sqlDB.QueryRow(`SELECT COUNT(*) FROM peer_events`).Scan(&n); err != nil {
		t.Fatal(err)
	}
	if n != 2 {
		t.Fatalf("expected 2 peer_events, got %d", n)
	}
}

func TestAddPeerEventFailureDoesNotFailCreateOrRevoke(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", t.TempDir()+"/wg0.conf")
	svc, sqlDB := setupPeerService(t)

	if _, err := sqlDB.Exec(`DROP TABLE peer_events`); err != nil {
		t.Fatal(err)
	}

	cfg, err := svc.CreatePeer(types.CreatePeer{
		Name:        "event-fail",
		DeviceType:  types.Desktop,
		NetworkRole: types.RoleGuest,
	}, "")
	if err != nil {
		t.Fatalf("CreatePeer must succeed when event log fails, got %v", err)
	}
	if cfg == "" {
		t.Fatal("expected client config")
	}

	peers, err := svc.Repo.GetAllPeers()
	if err != nil {
		t.Fatal(err)
	}
	if len(peers) != 1 || peers[0].Status != "active" || peers[0].Name != "event-fail" {
		t.Fatalf("peer not created correctly: %+v", peers)
	}

	if err := svc.RevokePeer(peers[0].PublicKey); err != nil {
		t.Fatalf("RevokePeer must succeed when event log fails, got %v", err)
	}

	peers, err = svc.Repo.GetAllPeers()
	if err != nil {
		t.Fatal(err)
	}
	if len(peers) != 1 || peers[0].Status != "revoked" {
		t.Fatalf("peer not revoked correctly: %+v", peers)
	}
}
