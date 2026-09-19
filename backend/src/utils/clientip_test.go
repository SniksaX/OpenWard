package utils

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClientIPIgnoresXFFWithoutTrustedProxy(t *testing.T) {
	t.Setenv("TRUSTED_PROXY", "")
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = "127.0.0.1:54321"
	r.Header.Set("X-Forwarded-For", "10.200.200.5")
	if got := ClientIP(r); got != "127.0.0.1" {
		t.Fatalf("ClientIP=%q, want 127.0.0.1 (XFF ignored)", got)
	}
}

func TestClientIPHonoursXFFFromTrustedProxy(t *testing.T) {
	t.Setenv("TRUSTED_PROXY", "127.0.0.1")
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.RemoteAddr = "127.0.0.1:54321"
	r.Header.Set("X-Forwarded-For", "10.200.200.5")
	if got := ClientIP(r); got != "10.200.200.5" {
		t.Fatalf("ClientIP=%q, want 10.200.200.5", got)
	}
}
