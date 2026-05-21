package controllers

import (
	"database/sql"
	"encoding/json"
	"net"
	"net/http"
	"openward/src/db"
	"openward/src/services"
	"openward/src/types"
	"openward/src/utils"
)

type UsersController struct {
	Repo      *db.UsersRepo
	PeersRepo *db.PeersRepo
	DB        *sql.DB
}

func (c *UsersController) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req types.CreateUserCred
	decode := json.NewDecoder(r.Body)
	decode.DisallowUnknownFields()

	if err := decode.Decode(&req); err != nil {
		utils.WriteJson(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := services.CreateUser(req, c.Repo); err != nil {
		utils.WriteJson(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]string{"message": "user created"})
}

func (c *UsersController) Login(w http.ResponseWriter, r *http.Request) {
	var req types.GetUserCred
	decode := json.NewDecoder(r.Body)
	decode.DisallowUnknownFields()

	if err := decode.Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	token, err := services.AuthenticateUser(req, c.Repo)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]string{
		"message": "Login successful",
		"token":   token,
	})
}

func (c *UsersController) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := c.Repo.GetAllUsers()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusOK, users)
}

func (c *UsersController) Identify(w http.ResponseWriter, r *http.Request) {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}

	peer, err := c.PeersRepo.GetPeerByIP(host)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "no active peer found for your IP address")
		return
	}

	if peer.UserID != nil {
		utils.WriteJson(w, http.StatusOK, map[string]interface{}{
			"status":  "claimed",
			"user_id": *peer.UserID,
			"peer_id": peer.ID,
		})
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"status":  "unclaimed",
		"peer_id": peer.ID,
	})
}

func (c *UsersController) ClaimAccount(w http.ResponseWriter, r *http.Request) {
	var req types.ClaimRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}

	token, err := services.ClaimAccount(req, host, c.Repo, c.PeersRepo, c.DB)
	if err != nil {
		utils.WriteError(w, http.StatusForbidden, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]string{
		"message": "Account claimed successfully",
		"token":   token,
	})
}
