package controllers

import (
	"encoding/json"
	"net/http"
	"openward/src/db"
	"openward/src/services"
	"openward/src/types"
	"openward/src/utils"
)

type UsersController struct {
	Repo *db.UsersRepo
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
