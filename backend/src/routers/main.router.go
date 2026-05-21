package routers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"openward/src/controllers"
	"openward/src/db"
	"openward/src/middlewares"
	"openward/src/services"
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
	usersController := &controllers.UsersController{
		Repo:      api.DB.Users,
		PeersRepo: api.DB.Peers,
		DB:        api.DB.SQL,
	}
	peersController := &controllers.PeersController{Service: peerService}

	api.RouterMux.HandleFunc("GET /api/healthCheck", controllers.HealthCheck)
	api.RouterMux.HandleFunc("GET /api/peers/{publicKey}/config", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetPeerConfig)))
	api.RouterMux.HandleFunc("POST /api/createPeer", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.CreatePeer)))
	api.RouterMux.HandleFunc("GET /api/streamStats", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.StreamLiveStats)))
	api.RouterMux.HandleFunc("DELETE /api/peers/{publicKey}", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.RevokePeer)))
	api.RouterMux.HandleFunc("GET /api/peers", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetAllPeers)))
	api.RouterMux.HandleFunc("GET /api/users/{id}/peers", middlewares.RequireAdminIP(middlewares.RequireAuth(peersController.GetUserPeers)))
	api.RouterMux.HandleFunc("GET /api/users", middlewares.RequireAdminIP(middlewares.RequireAuth(usersController.GetAllUsers)))
	// Public auth routes (no RequireAuth or RequireAdminIP)
	api.RouterMux.HandleFunc("GET /api/auth/identify", usersController.Identify)
	api.RouterMux.HandleFunc("POST /api/auth/claim", usersController.ClaimAccount)

	api.RouterMux.HandleFunc("POST /api/createUser", middlewares.RequireAdminIP(usersController.CreateUser))
	api.RouterMux.HandleFunc("POST /api/login", middlewares.RequireAdminIP(usersController.Login))

	api.RouterMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.Clean(r.URL.Path)
		localPath := filepath.Join("./dist", cleanPath)

		info, err := os.Stat(localPath)

		if err == nil && !info.IsDir() {
			http.ServeFile(w, r, localPath)
			return
		}

		htmlPath := localPath + ".html"
		if _, err := os.Stat(htmlPath); err == nil {
			http.ServeFile(w, r, htmlPath)
			return
		}

		if err == nil && info.IsDir() {
			indexPath := filepath.Join(localPath, "index.html")
			if _, err := os.Stat(indexPath); err == nil {
				http.ServeFile(w, r, indexPath)
				return
			}
		}

		if strings.Contains(cleanPath, ".") {
			http.NotFound(w, r)
			return
		}

		http.ServeFile(w, r, "./dist/index.html")
	})
}
