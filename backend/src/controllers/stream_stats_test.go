package controllers

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"openward/src/services"
)

func TestStreamLiveStatsStopsOnCancel(t *testing.T) {
	t.Setenv("APP_ENV", "dev")
	t.Setenv("WG_CONFIG_PATH", t.TempDir()+"/wg0.conf")

	svc := services.NewPeerService(nil)
	c := &PeersController{Service: svc}

	ctx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest("GET", "/api/streamStats", nil).WithContext(ctx)
	rec := httptest.NewRecorder()

	done := make(chan struct{})
	go func() {
		c.StreamLiveStats(rec, req)
		close(done)
	}()

	time.Sleep(30 * time.Millisecond)
	start := time.Now()
	cancel()
	select {
	case <-done:
		if time.Since(start) > 500*time.Millisecond {
			t.Fatal("disconnect did not return promptly")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("stream did not stop on cancel")
	}
}
