package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"openflag/internal/config"
	"openflag/internal/database"
	"openflag/internal/router"
	"openflag/internal/version"
)

func main() {
	showVersion := flag.Bool("version", false, "print build version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println(version.String())
		return
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
