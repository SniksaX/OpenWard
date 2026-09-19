package db

import (
	"database/sql"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

type AppDB struct {
	SQL   *sql.DB
	Users *UsersRepo
	Peers *PeersRepo
}

func InitDB() (*AppDB, error) {
	path := os.Getenv("DB_PATH")
	if path == "" {
		path = "./database.db"
	}
	dsn := path + "?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on"

	conn, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(1)

	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, err
	}

	appDB := &AppDB{
		SQL:   conn,
		Users: &UsersRepo{db: conn},
		Peers: &PeersRepo{db: conn},
	}

	return appDB, nil
}
