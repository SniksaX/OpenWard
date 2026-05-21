package middlewares

import (
	"net"
	"net/http"
	"os"

	"openward/src/utils"
)

func RequireAdminIP(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Bypass IP check if in DEV mode
		if os.Getenv("APP_ENV") == "dev" {
			next.ServeHTTP(w, r)
			return
		}

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

		if ip[0] == 10 && ip[1] == 200 && ip[2] == 200 {
			lastOctet := ip[3]

			if lastOctet >= 2 && lastOctet <= 15 {
				next.ServeHTTP(w, r)
				return
			}
		}

		utils.WriteError(w, http.StatusForbidden, "Network Error: Unauthorized device IP. Only VPN Admins can access this system.")
	}
}
