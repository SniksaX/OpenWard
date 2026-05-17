package middlewares

import (
	"net"
	"net/http"
	"os"

	"openward/src/utils"
)

// RequireAdminIP ensures only IPs in the 10.200.200.2 - 10.200.200.15 range can access the route.
func RequireAdminIP(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Bypass IP check if in DEV mode
		if os.Getenv("APP_ENV") == "dev" {
			next.ServeHTTP(w, r)
			return
		}

		// r.RemoteAddr contains IP:Port (e.g., "10.200.200.5:43921")
		ipStr, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			utils.WriteError(w, http.StatusForbidden, "Invalid connection format")
			return
		}

		ip := net.ParseIP(ipStr).To4()
		if ip == nil {
			utils.WriteError(w, http.StatusForbidden, "Only IPv4 connections allowed")
			return
		}

		// Check if it's within the WireGuard subnet (10.200.200.x)
		if ip[0] == 10 && ip[1] == 200 && ip[2] == 200 {
			lastOctet := ip[3]

			// Admins are IPs ending in .2 through .15
			if lastOctet >= 2 && lastOctet <= 15 {
				next.ServeHTTP(w, r)
				return
			}
		}

		// If they reach here, they are not an Admin IP
		utils.WriteError(w, http.StatusForbidden, "Network Error: Unauthorized device IP. Only VPN Admins can access this system.")
	}
}
