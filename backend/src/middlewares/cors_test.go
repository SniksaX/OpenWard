package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSUnsetIsNoOp(t *testing.T) {
	t.Setenv("CORS_ORIGIN", "")
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthCheck", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := CORS(mux)

	req := httptest.NewRequest(http.MethodOptions, "/api/healthCheck", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("unset CORS_ORIGIN must not set ACAO, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}

	req = httptest.NewRequest(http.MethodGet, "/api/healthCheck", nil)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "" ||
		rec.Header().Get("Access-Control-Allow-Methods") != "" ||
		rec.Header().Get("Access-Control-Allow-Headers") != "" {
		t.Fatalf("unset CORS_ORIGIN leaked CORS headers: %v", rec.Header())
	}
}

func TestCORSStarIsNoOp(t *testing.T) {
	t.Setenv("CORS_ORIGIN", "*")
	h := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/peers", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("must never emit *, got %q", got)
	}
}

func TestCORSPreflightBeforeAuth(t *testing.T) {
	t.Setenv("CORS_ORIGIN", "http://localhost:3000")
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/streamToken", RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	}))
	mux.HandleFunc("GET /api/streamStats", func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("preflight must not reach the GET handler")
	})
	h := CORS(mux)

	req := httptest.NewRequest(http.MethodOptions, "/api/streamToken", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status %d body %s", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Fatalf("ACAO=%q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
	if rec.Header().Get("Access-Control-Allow-Methods") != "GET, POST, DELETE, OPTIONS" {
		t.Fatalf("Allow-Methods=%q", rec.Header().Get("Access-Control-Allow-Methods"))
	}
	if rec.Header().Get("Access-Control-Allow-Headers") != "Authorization, Content-Type" {
		t.Fatalf("Allow-Headers=%q", rec.Header().Get("Access-Control-Allow-Headers"))
	}

	req = httptest.NewRequest(http.MethodOptions, "/api/streamStats", nil)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("streamStats preflight status %d", rec.Code)
	}
}

func TestCORSHeadersOnSSEGET(t *testing.T) {
	t.Setenv("CORS_ORIGIN", "http://localhost:3000")
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/streamStats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("data: []\n\n"))
	})
	h := CORS(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/streamStats?token=opaque", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
		t.Fatalf("SSE missing ACAO, got %q", rec.Header().Get("Access-Control-Allow-Origin"))
	}
	if rec.Header().Get("Content-Type") != "text/event-stream" {
		t.Fatalf("Content-Type=%q", rec.Header().Get("Content-Type"))
	}
}

func TestCORSEchoesMatchingLoopbackOrigin(t *testing.T) {
	t.Setenv("CORS_ORIGIN", "http://127.0.0.1:3000,http://localhost:3000")
	h := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodOptions, "/api/login", nil)
	req.Header.Set("Origin", "http://127.0.0.1:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "content-type")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://127.0.0.1:3000" {
		t.Fatalf("ACAO=%q", got)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req.Header.Set("Origin", "http://evil.example")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("must not echo a non-allowlisted origin")
	}
}
