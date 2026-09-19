package services

import (
	"os"
	"strings"
	"testing"

	"openward/src/db"
	"openward/src/types"

	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

func setupPeerService(t *testing.T) *PeerService {
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
	return NewPeerService(app.Peers)
}

func TestCreatePeerRollsBackDBWhenKernelApplyFails(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	svc := setupPeerService(t)

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
	svc := setupPeerService(t)

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
