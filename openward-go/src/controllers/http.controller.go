package controllers

import (
	"net/http"
	"openward/src/utils"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"message:": "Connection is good",
	}

	utils.WriteJson(w, http.StatusOK, data)
}
