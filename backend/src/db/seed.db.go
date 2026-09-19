package db

import (
	"errors"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"

	"openward/src/types"
)

func (u *UsersRepo) SeedBootstrapAdmin() error {
	var count int
	if err := u.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	username := os.Getenv("ADMIN_USERNAME")
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")

	if username == "" && email == "" && password == "" {
		log.Println("WARNING: users table is empty and ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD are unset; no bootstrap admin was created")
		return nil
	}
	if username == "" || email == "" || password == "" {
		return errors.New("ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be set to seed the first admin")
	}
	if len(password) < 12 {
		return errors.New("ADMIN_PASSWORD must be at least 12 characters")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = u.InsertUser(types.UserCred{
		Username: username,
		Email:    email,
		Password: string(hashedBytes),
		Role:     "admin",
	})
	if err != nil {
		return err
	}

	log.Println("bootstrap admin created from ADMIN_* env vars; remove ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD afterward")
	return nil
}
