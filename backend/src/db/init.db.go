package db

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

type AppDB struct {
	SQL   *sql.DB
	Users *UsersRepo
	Peers *PeersRepo
}

func InitDB() (*AppDB, error) {
	conn, err := sql.Open("sqlite3", "./database.db")

	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	conn.Exec("PRAGMA journal_mode=WAL")
	conn.Exec("PRAGMA foreign_keys=ON")

	appDB := &AppDB{
		SQL:   conn,
		Users: &UsersRepo{db: conn},
		Peers: &PeersRepo{db: conn},
	}

	return appDB, nil
}
