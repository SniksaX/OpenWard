package middlewares

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"openward/src/utils"
)

func TestStreamTokenSingleUseAndExpiry(t *testing.T) {
	store := NewStreamTokenStore()
	token, err := store.Issue()
	if err != nil {
		t.Fatal(err)
	}
	if !store.Consume(token) {
		t.Fatal("first consume should succeed")
	}
	if store.Consume(token) {
		t.Fatal("second consume should fail")
	}

	expired, err := store.issue(time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	time.Sleep(5 * time.Millisecond)
	if store.Consume(expired) {
		t.Fatal("expired token should fail")
	}
}

func TestRequireAuthRejectsQueryJWT(t *testing.T) {
	t.Setenv("APP_SECRET", strings.Repeat("s", 32))
	if err := utils.InitSecret(); err != nil {
		t.Fatal(err)
	}
	jwt, err := utils.GenerateToken(1, "root", "admin")
	if err != nil {
		t.Fatal(err)
	}

	h := RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/api/users?token="+jwt, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("query JWT must be rejected, got %d %s", rec.Code, rec.Body.String())
	}

	store := NewStreamTokenStore()
	streamTok, err := store.Issue()
	if err != nil {
		t.Fatal(err)
	}
	ok := RequireStreamToken(store, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	req = httptest.NewRequest(http.MethodGet, "/api/streamStats?token="+streamTok, nil)
	rec = httptest.NewRecorder()
	ok.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("stream token first use got %d", rec.Code)
	}
	req = httptest.NewRequest(http.MethodGet, "/api/streamStats?token="+streamTok, nil)
	rec = httptest.NewRecorder()
	ok.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("stream token reuse got %d", rec.Code)
	}
}

func TestRequireAdminIPIPv4MappedAndIPv6(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("ALLOW_INSECURE_LOCAL", "")

	h := RequireAdminIP(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "[::ffff:10.200.200.5]:54321"
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("mapped IPv4 admin IP got %d %s", rec.Code, rec.Body.String())
	}

	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "[2001:db8::1]:54321"
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("real IPv6 got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "IPv6") {
		t.Fatalf("expected IPv6 error, got %s", rec.Body.String())
	}
}
