package main

import (
	"fmt"
	"log"
	"net/http"
	"openward/src/db"
	"openward/src/middlewares"
	"openward/src/routers"
	"openward/src/utils"
)

func main() {
	if err := utils.InitSecret(); err != nil {
		log.Fatal(err)
	}
	middlewares.WarnIfInsecureLocal()

	myDB, err := db.InitDB()
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer myDB.SQL.Close()

	if err := myDB.Users.CreateTable(); err != nil {
		log.Fatalf("Could not create users table: %v", err)
	}
	if err := myDB.Peers.CreateTable(); err != nil {
		log.Fatalf("Could not create peers table: %v", err)
	}
	if err := myDB.Users.SeedBootstrapAdmin(); err != nil {
		log.Fatalf("Could not seed bootstrap admin: %v", err)
	}

	router := routers.CreateRouter(myDB)
	router.RegisterRouter()

	port := ":4444"
	fmt.Println("server starting on port", port)

	if err := http.ListenAndServe(port, router.RouterMux); err != nil {
		log.Fatal(err)
	}
}
