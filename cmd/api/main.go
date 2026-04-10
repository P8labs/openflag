package main

import (
	"log"
	"net/http"

	"openflag/internal/config"
	"openflag/internal/database"
	"openflag/internal/router"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	cfg := config.Load()
	db, err := database.Open(cfg)
	if err != nil {
		log.Fatal(err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatal(err)
	}

	engine := router.New(cfg, db)
	server := &http.Server{Addr: ":" + cfg.Port, Handler: engine}

	log.Printf("api server listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
