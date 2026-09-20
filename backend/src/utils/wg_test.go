package utils

import (
	"testing"

	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

func TestInitWireGuardSkippedInDev(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_SERVER_PRIVATE_KEY", "")
	t.Setenv("WG_SERVER_PUBLIC_KEY", "")
	t.Setenv("WG_SERVER_ENDPOINT", "")
	if err := InitWireGuard(); err != nil {
		t.Fatal(err)
	}
}

func TestInitWireGuardRequiresKeys(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("WG_SERVER_PRIVATE_KEY", "")
	t.Setenv("WG_SERVER_PUBLIC_KEY", "")
	t.Setenv("WG_SERVER_ENDPOINT", "")
	if err := InitWireGuard(); err == nil {
		t.Fatal("expected error when keys missing")
	}

	priv, err := wgtypes.GeneratePrivateKey()
	if err != nil {
		t.Fatal(err)
	}
	t.Setenv("WG_SERVER_PRIVATE_KEY", "not-a-key")
	t.Setenv("WG_SERVER_PUBLIC_KEY", priv.PublicKey().String())
	t.Setenv("WG_SERVER_ENDPOINT", "vpn.example:51820")
	if err := InitWireGuard(); err == nil {
		t.Fatal("expected error for invalid private key")
	}

	t.Setenv("WG_SERVER_PRIVATE_KEY", priv.String())
	t.Setenv("WG_SERVER_PUBLIC_KEY", "nope")
	if err := InitWireGuard(); err == nil {
		t.Fatal("expected error for invalid public key")
	}

	t.Setenv("WG_SERVER_PUBLIC_KEY", priv.PublicKey().String())
	t.Setenv("WG_SERVER_ENDPOINT", "vpn.example")
	if err := InitWireGuard(); err == nil {
		t.Fatal("expected error for endpoint without port")
	}

	t.Setenv("WG_SERVER_ENDPOINT", "vpn.example:51820")
	if err := InitWireGuard(); err != nil {
		t.Fatal(err)
	}
}
