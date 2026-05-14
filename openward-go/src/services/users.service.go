package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"openward/src/db"
	"openward/src/types"
	"openward/src/utils"
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

func AuthenticateUser(req types.GetUserCred, userRepo *db.UsersRepo) (string, error) {
	if req.Email == "" || req.Password == "" {
		return "", errors.New("email and password cannot be empty")
	}

	user, err := userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		return "", errors.New("failed to generate authentication token")
	}

	return token, nil
}
