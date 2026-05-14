package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"openward/src/services"
	"openward/src/types"
	"openward/src/utils"
)

type PeersController struct {
	Service *services.PeerService
}

func (c *PeersController) CreatePeer(w http.ResponseWriter, r *http.Request) {

	var req types.CreatePeer
	decode := json.NewDecoder(r.Body)
	decode.DisallowUnknownFields()

	if err := decode.Decode(&req); err != nil {
		utils.WriteJson(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		return
	}

	clientConfig, err := c.Service.CreatePeer(req, req.Passphrase)
	if err != nil {
		utils.WriteJson(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]any{
		"message":       "peer created",
		"client_config": clientConfig,
	})
}

func (c *PeersController) StreamLiveStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()

	for {
		select {
		case <-ctx.Done():
			fmt.Println("Client disconnected from live stream")
			return

		default:
			stats, err := c.Service.GetLiveStats()
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
				flusher.Flush()
				return
			}

			jsonData, err := json.Marshal(stats)
			if err != nil {
			}

			fmt.Fprintf(w, "data: %s\n\n", string(jsonData))

			flusher.Flush()

			time.Sleep(1 * time.Second)
		}
	}
}

func (c *PeersController) RevokePeer(w http.ResponseWriter, r *http.Request) {
	publicKey := r.PathValue("publicKey")
	if publicKey == "" {
		utils.WriteError(w, http.StatusBadRequest, "Public key is required")
		return
	}

	err := c.Service.RevokePeer(publicKey)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]string{"message": "Peer revoked successfully"})
}

func (c *PeersController) GetAllPeers(w http.ResponseWriter, r *http.Request) {
	peers, err := c.Service.Repo.GetAllPeers()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.WriteJson(w, http.StatusOK, map[string]any{"peers": peers})
}

func (c *PeersController) GetUserPeers(w http.ResponseWriter, r *http.Request) {
	userIdStr := r.PathValue("id")
	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	peers, err := c.Service.Repo.GetPeersByUserID(userId)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]any{"peers": peers})
}
