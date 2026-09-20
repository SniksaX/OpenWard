package services

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestSyncWgConfigDevDoesNotTouchEtcWireguard(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", "")

	etcPath := "/etc/wireguard/wg0.conf"
	var existed bool
	var mod time.Time
	if st, err := os.Stat(etcPath); err == nil {
		existed = true
		mod = st.ModTime()
	}

	svc, _ := setupPeerService(t)
	if err := SyncWgConfig(svc.Repo); err != nil {
		t.Fatal(err)
	}

	if st, err := os.Stat(etcPath); err == nil {
		if !existed {
			t.Fatal("dev SyncWgConfig created /etc/wireguard/wg0.conf")
		}
		if !st.ModTime().Equal(mod) {
			t.Fatal("dev SyncWgConfig touched /etc/wireguard/wg0.conf")
		}
	} else if existed {
		t.Fatal("dev SyncWgConfig removed /etc/wireguard/wg0.conf")
	}

	want := filepath.Join(os.TempDir(), "openward-wg0.conf")
	if wgConfigPath() != want {
		t.Fatalf("wgConfigPath=%q want %q", wgConfigPath(), want)
	}
	if _, err := os.Stat(want); err != nil {
		t.Fatalf("expected temp wg config at %s: %v", want, err)
	}
}

func TestSyncWgConfigTemplatesEgressIface(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	path := t.TempDir() + "/wg0.conf"
	t.Setenv("WG_CONFIG_PATH", path)
	t.Setenv("WG_EGRESS_IFACE", "eth0")

	svc, _ := setupPeerService(t)
	if err := SyncWgConfig(svc.Repo); err != nil {
		t.Fatal(err)
	}
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(body, []byte("-o eth0 -j MASQUERADE")) {
		t.Fatalf("expected eth0 masquerade, got:\n%s", body)
	}
	if bytes.Contains(body, []byte("-o ens3")) {
		t.Fatal("default ens3 still present")
	}
}

func TestEgressIfaceDefault(t *testing.T) {
	t.Setenv("WG_EGRESS_IFACE", "")
	if egressIface() != "ens3" {
		t.Fatalf("default=%q", egressIface())
	}
}
