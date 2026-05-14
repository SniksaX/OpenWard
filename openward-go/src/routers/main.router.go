package routers

import (
	"net/http"
	"openward/src/controllers"
	"openward/src/db"
	"os"
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
    // 1. Define your API routes FIRST (Go router gives priority to exact matches)
    
	peerService := services.NewPeerService(api.DB.Peers)
	usersController := &controllers.UsersController{Repo: api.DB.Users}
	peersController := &controllers.PeersController{Service: peerService}

	// Public API Routes
	api.RouterMux.HandleFunc("GET /api/healthCheck", controllers.HealthCheck)
	api.RouterMux.HandleFunc("POST /api/createUser", usersController.CreateUser)
	api.RouterMux.HandleFunc("POST /api/login", usersController.Login)

	// Protected API Routes
	api.RouterMux.HandleFunc("POST /api/createPeer", middlewares.RequireAuth(peersController.CreatePeer))
	api.RouterMux.HandleFunc("GET /api/streamStats", middlewares.RequireAuth(peersController.StreamLiveStats))
	api.RouterMux.HandleFunc("DELETE /api/peers/{publicKey}", middlewares.RequireAuth(peersController.RevokePeer))
	api.RouterMux.HandleFunc("GET /api/peers", middlewares.RequireAuth(peersController.GetAllPeers))
	api.RouterMux.HandleFunc("GET /api/users/{id}/peers", middlewares.RequireAuth(peersController.GetUserPeers))

    // 2. Handle React Router (SPA)
    // If you use React Router, you need to serve index.html for all non-API, non-file paths
	api.RouterMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := "./dist" + r.URL.Path
		// If the file exists in /dist (like index.js or logo.png), serve it
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			http.ServeFile(w, r, path)
			return
		}
		// Otherwise, serve index.html so React Router can take over
		http.ServeFile(w, r, "./dist/index.html")
	})
}