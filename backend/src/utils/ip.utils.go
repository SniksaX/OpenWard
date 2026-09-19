package utils

import (
	"net"
	"net/http"
	"os"
	"strings"
)

func ClientIP(r *http.Request) string {
	remote := r.RemoteAddr
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		remote = host
	}

	trusted := os.Getenv("TRUSTED_PROXY")
	if trusted == "" || remote != trusted {
		return remote
	}

	xff := r.Header.Get("X-Forwarded-For")
	if xff == "" {
		return remote
	}

	parts := strings.Split(xff, ",")
	for i := len(parts) - 1; i >= 0; i-- {
		hop := strings.TrimSpace(parts[i])
		if host, _, err := net.SplitHostPort(hop); err == nil {
			hop = host
		}
		if hop == "" || hop == trusted {
			continue
		}
		return hop
	}
	return remote
}
