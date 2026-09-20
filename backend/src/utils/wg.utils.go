package utils

import (
	"errors"
	"net"
	"os"
	"strconv"

	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

func InitWireGuard() error {
	if os.Getenv("APP_ENV") == "dev" {
		return nil
	}

	if _, err := wgtypes.ParseKey(os.Getenv("WG_SERVER_PRIVATE_KEY")); err != nil {
		return errors.New("WG_SERVER_PRIVATE_KEY must be set and a valid WireGuard key")
	}
	if _, err := wgtypes.ParseKey(os.Getenv("WG_SERVER_PUBLIC_KEY")); err != nil {
		return errors.New("WG_SERVER_PUBLIC_KEY must be set and a valid WireGuard key")
	}
	if !validEndpoint(os.Getenv("WG_SERVER_ENDPOINT")) {
		return errors.New("WG_SERVER_ENDPOINT must be set as host:port")
	}
	return nil
}

func validEndpoint(ep string) bool {
	host, port, err := net.SplitHostPort(ep)
	if err != nil || host == "" {
		return false
	}
	n, err := strconv.Atoi(port)
	return err == nil && n >= 1 && n <= 65535
}
