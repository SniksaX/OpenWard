package db

import (
	"database/sql"
	"openward/src/types"
)

type UsersRepo struct {
	db *sql.DB
}

func (u *UsersRepo) CreateTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username VARCHAR(50) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(60) NOT NULL
		)
	`
	_, err := u.db.Exec(query)
	return err
}

func (u *UsersRepo) InsertUser(req types.UserCred) error {
	query := `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`
	_, err := u.db.Exec(query, req.Username, req.Email, req.Password)
	return err
}
