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
			password_hash VARCHAR(60) NOT NULL,
			role VARCHAR(20) DEFAULT 'standard' NOT NULL
		)
	`
	_, err := u.db.Exec(query)
	return err
}

func (u *UsersRepo) InsertUser(req types.UserCred) error {
	query := `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`
	_, err := u.db.Exec(query, req.Username, req.Email, req.Password, req.Role)
	return err
}

func (u *UsersRepo) GetUserByEmail(email string) (*types.UserCred, error) {
	query := `SELECT id, username, email, password_hash, role FROM users WHERE email = ?`

	var user types.UserCred
	err := u.db.QueryRow(query, email).Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.Role)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (u *UsersRepo) GetAllUsers() ([]types.UserCred, error) {
	query := `SELECT id, username, email, role FROM users`

	rows, err := u.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []types.UserCred
	for rows.Next() {
		var user types.UserCred
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if users == nil {
		users = []types.UserCred{}
	}

	return users, nil
}

func (u *UsersRepo) InsertUserTx(tx *sql.Tx, req types.UserCred) (int, error) {
	query := `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`
	res, err := tx.Exec(query, req.Username, req.Email, req.Password, req.Role)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return int(id), err
}
