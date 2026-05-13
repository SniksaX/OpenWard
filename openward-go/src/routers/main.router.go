package routers

import (
	"net/http"
	"openward/src/controllers"
	"openward/src/db"
)

type TypeRouter struct {
	RouterMux *http.ServeMux
	DB        *db.AppDB
}

func CreateRouter(database *db.AppDB) *TypeRouter {
	return &TypeRouter{
		RouterMux: http.NewServeMux(),
		DB:        database,
	}
}

func (api *TypeRouter) RegisterRouter() {
	usersController := &controllers.UsersController{
		Repo: api.DB.Users,
	}

	api.RouterMux.HandleFunc("GET /api/healthCheck", controllers.HealthCheck)

	api.RouterMux.HandleFunc("POST /api/createUser", usersController.CreateUser)
}
