package routers

import (
	"net/http"
	"openward/src/controllers"
	"openward/src/db"
	"openward/src/middlewares"
	"openward/src/services"
	"os"
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

	peerService := services.NewPeerService(api.DB.Peers)
	usersController := &controllers.UsersController{Repo: api.DB.Users}
	peersController := &controllers.PeersController{Service: peerService}

	api.RouterMux.HandleFunc("GET /api/healthCheck", controllers.HealthCheck)
	api.RouterMux.HandleFunc("GET /api/peers/{publicKey}/config", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetPeerConfig)))

	api.RouterMux.HandleFunc("POST /api/createPeer", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.CreatePeer)))
	api.RouterMux.HandleFunc("GET /api/streamStats", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.StreamLiveStats)))
	api.RouterMux.HandleFunc("DELETE /api/peers/{publicKey}", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.RevokePeer)))
	api.RouterMux.HandleFunc("GET /api/peers", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetAllPeers)))
	api.RouterMux.HandleFunc("GET /api/users/{id}/peers", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetUserPeers)))

	api.RouterMux.HandleFunc("POST /api/createUser", middlewares.RequireAdminIP(usersController.CreateUser))
	api.RouterMux.HandleFunc("POST /api/login", middlewares.RequireAdminIP(usersController.Login))

	api.RouterMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := "./dist" + r.URL.Path
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			http.ServeFile(w, r, path)
			return
		}
		http.ServeFile(w, r, "./dist/index.html")
	})
}
