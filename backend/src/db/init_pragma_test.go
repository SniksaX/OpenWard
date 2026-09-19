package db

import (
	"os"
	"path/filepath"
	"testing"
)

func TestInitDBAppliesDSNPragmas(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "ow.db")
	t.Setenv("DB_PATH", path)

	app, err := InitDB()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = app.SQL.Close() })

	var journal string
	if err := app.SQL.QueryRow("PRAGMA journal_mode").Scan(&journal); err != nil {
		t.Fatal(err)
	}
	if journal != "wal" {
		t.Fatalf("journal_mode=%q, want wal", journal)
	}

	var fk int
	if err := app.SQL.QueryRow("PRAGMA foreign_keys").Scan(&fk); err != nil {
		t.Fatal(err)
	}
	if fk != 1 {
		t.Fatalf("foreign_keys=%d, want 1", fk)
	}

	var timeout int
	if err := app.SQL.QueryRow("PRAGMA busy_timeout").Scan(&timeout); err != nil {
		t.Fatal(err)
	}
	if timeout != 5000 {
		t.Fatalf("busy_timeout=%d, want 5000", timeout)
	}

	if _, err := os.Stat(path); err != nil {
		t.Fatalf("DB_PATH file missing: %v", err)
	}
}
