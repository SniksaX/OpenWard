package controllers

import (
	"encoding/json"
	"net/http"

	"openward/src/db"
	"openward/src/services"
	"openward/src/types"
	"openward/src/utils"
)

type PeerController struct {
	Repo *db.PeersRepo
}

func (c *PeerController) CreatePeer(w http.ResponseWriter, r *http.Request) {

	var req types.CreatePeer
	decode := json.NewDecoder(r.Body)
	decode.DisallowUnknownFields()

	if err := decode.Decode(&req); err != nil {
		utils.WriteJson(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	clientConfig, err := services.CreatePeer(req, req.Passphrase, c.Repo)
	if err != nil {
		utils.WriteJson(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]any{
		"message":       "peer created",
		"client_config": clientConfig,
	})

}
