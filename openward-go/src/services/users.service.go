package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"openward/src/db"
	"openward/src/types"
)

func CreateUser(req types.CreateUserCred, userRepo *db.UsersRepo) error {
	if req.Email == "" {
		return errors.New("email cannot be empty")
	}
	if req.Username == "" {
		return errors.New("username cannot be empty")
	}
	if req.Password == "" {
		return errors.New("password cannot be empty")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	newUser := types.UserCred{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedBytes),
	}

	err = userRepo.InsertUser(newUser)
	if err != nil {
		return errors.New("user with this email already exists")
	}

	return nil
}
