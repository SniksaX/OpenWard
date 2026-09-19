package middlewares

import (
	"log"
	"net"
	"net/http"
	"os"

	"openward/src/utils"
)

func insecureLocalBypass() bool {
	return os.Getenv("APP_ENV") == "dev" && os.Getenv("ALLOW_INSECURE_LOCAL") == "true"
}

func WarnIfInsecureLocal() {
	if !insecureLocalBypass() {
		return
	}
	log.Println("************************************************************************")
	log.Println("WARNING: RequireAdminIP is BYPASSED")
	log.Println("APP_ENV=dev and ALLOW_INSECURE_LOCAL=true — admin IP enforcement is disabled")
	log.Println("Do not use this configuration in production")
	log.Println("************************************************************************")
}

func RequireAdminIP(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if insecureLocalBypass() {
			next.ServeHTTP(w, r)
			return
		}

		ipStr := utils.ClientIP(r)
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
