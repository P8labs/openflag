package main

import (
	"fmt"
	"log"
	"net/http"

	"openflag/internal/api"
	"openflag/internal/engine/config"
)

func main() {
	cfg := config.Load()
	server := api.NewServer(cfg)

	addr := ":8081"
	fmt.Println("OpenFlag dev viewer running at http://localhost" + addr)
	fmt.Println("Serving graph artifacts from:", cfg.CheckpointPath())

	if err := http.ListenAndServe(addr, server.Handler()); err != nil {
		log.Fatal(err)
	}
}
