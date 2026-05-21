package services

import (
	"database/sql"
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

	role := req.Role
	if role == "" {
		role = "standard"
	}

	newUser := types.UserCred{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedBytes),
		Role:     role,
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

	token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return "", errors.New("failed to generate authentication token")
	}

	return token, nil
}

func ClaimAccount(req types.ClaimRequest, callerIP string, userRepo *db.UsersRepo, peersRepo *db.PeersRepo, dbConn *sql.DB) (string, error) {
	peer, err := peersRepo.GetPeerByIP(callerIP)
	if err != nil {
		return "", errors.New("no active peer found for your IP address")
	}

	if peer.ID != req.PeerID {
		return "", errors.New("peer_id does not match your WireGuard IP — claim rejected")
	}

	if peer.UserID != nil {
		return "", errors.New("this peer has already been claimed")
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		return "", errors.New("username, email, and password are required")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return "", errors.New("failed to hash password")
	}

	newUser := types.UserCred{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedBytes),
		Role:     "standard",
	}

	tx, err := dbConn.Begin()
	if err != nil {
		return "", errors.New("failed to begin transaction")
	}
	defer tx.Rollback()

	newUserID, err := userRepo.InsertUserTx(tx, newUser)
	if err != nil {
		return "", errors.New("a user with that email already exists")
	}

	if err := peersRepo.ClaimPeer(tx, req.PeerID, newUserID); err != nil {
		return "", err
	}

	if err := tx.Commit(); err != nil {
		return "", errors.New("failed to commit claim transaction")
	}

	token, err := utils.GenerateToken(newUserID, req.Username, "standard")
	if err != nil {
		return "", errors.New("failed to generate token")
	}

	return token, nil
}
