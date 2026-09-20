package routers

import (
	"path/filepath"
	"testing"
)

func TestServeDirDefaultAndEnv(t *testing.T) {
	t.Setenv("SERVE_DIR", "")
	if ServeDir() != "./dist" {
		t.Fatalf("default ServeDir=%q", ServeDir())
	}
	t.Setenv("SERVE_DIR", "/app/dist")
	if ServeDir() != "/app/dist" {
		t.Fatalf("env ServeDir=%q", ServeDir())
	}
}

func TestStaticPathStaysUnderRoot(t *testing.T) {
	t.Setenv("SERVE_DIR", "/app/dist")
	got := staticPath("/dashboard/index.html")
	want := filepath.Join("/app/dist", "dashboard", "index.html")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	escaped := staticPath("/../../etc/passwd")
	if escaped == "/etc/passwd" || filepath.IsAbs(escaped) && escaped == "/etc/passwd" {
		t.Fatalf("path escaped root: %q", escaped)
	}
	if filepath.Dir(escaped) == "/etc" {
		t.Fatalf("path escaped root: %q", escaped)
	}
}

func TestStaticPathJoinDoesNotDropRoot(t *testing.T) {
	t.Setenv("SERVE_DIR", "./dist")
	got := staticPath("/index.html")
	want := filepath.Join("dist", "index.html")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}
