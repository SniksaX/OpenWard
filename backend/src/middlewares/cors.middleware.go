package middlewares

import (
	"net/http"
	"os"
	"strings"
)

func corsAllowlist() []string {
	raw := strings.TrimSpace(os.Getenv("CORS_ORIGIN"))
	if raw == "" || raw == "*" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part == "" || part == "*" {
			continue
		}
		out = append(out, part)
	}
	return out
}

func corsEchoOrigin(reqOrigin string, allowlist []string) string {
	if len(allowlist) == 0 {
		return ""
	}
	if reqOrigin != "" {
		for _, origin := range allowlist {
			if reqOrigin == origin {
				return origin
			}
		}
		return ""
	}
	if len(allowlist) == 1 {
		return allowlist[0]
	}
	return ""
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		echo := corsEchoOrigin(r.Header.Get("Origin"), corsAllowlist())
		if echo == "" {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", echo)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Add("Vary", "Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
