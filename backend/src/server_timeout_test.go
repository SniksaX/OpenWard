package main

import (
	"net/http"
	"testing"
	"time"
)

func TestHTTPServerTimeouts(t *testing.T) {
	srv := newHTTPServer(http.NotFoundHandler())
	if srv.ReadHeaderTimeout != 10*time.Second {
		t.Fatalf("ReadHeaderTimeout=%s", srv.ReadHeaderTimeout)
	}
	if srv.IdleTimeout != 120*time.Second {
		t.Fatalf("IdleTimeout=%s", srv.IdleTimeout)
	}
	if srv.WriteTimeout != 0 {
		t.Fatalf("WriteTimeout must be 0 for SSE, got %s", srv.WriteTimeout)
	}
}
