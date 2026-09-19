package db

import (
	"database/sql"
	"fmt"
	"sync"
	"testing"

	"openward/src/types"
)

func TestAllocateAndInsertPeerNoDuplicateIPs(t *testing.T) {
	path := t.TempDir() + "/t.db"
	conn, err := sql.Open("sqlite3", path+"?_busy_timeout=5000")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	conn.SetMaxOpenConns(1)

	repo := &PeersRepo{db: conn}
	if err := repo.CreateTable(); err != nil {
		t.Fatal(err)
	}

	const n = 20
	errCh := make(chan error, n)
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, err := repo.AllocateAndInsertPeer(types.RoleGuest, func(ip string) types.Peer {
				return types.Peer{
					Name:        fmt.Sprintf("p-%d", i),
					PublicKey:   fmt.Sprintf("pk-%02d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", i),
					Status:      "active",
					DeviceType:  types.Desktop,
					NetworkRole: types.RoleGuest,
				}
			})
			errCh <- err
		}(i)
	}
	wg.Wait()
	close(errCh)
	for err := range errCh {
		if err != nil {
			t.Fatalf("duplicate-IP or insert error: %v", err)
		}
	}

	var total, distinct int
	if err := conn.QueryRow(`SELECT COUNT(*), COUNT(DISTINCT ip_address) FROM peers`).Scan(&total, &distinct); err != nil {
		t.Fatal(err)
	}
	if total != n {
		t.Fatalf("expected %d rows, got %d", n, total)
	}
	if total != distinct {
		t.Fatalf("duplicate IPs: COUNT(*)=%d COUNT(DISTINCT ip_address)=%d", total, distinct)
	}
}
