package main

import (
	"fmt"

	"openflag/internal/engine"
	"openflag/internal/engine/config"
)

func main() {
	// if len(os.Args) < 2 {
	// 	fmt.Println("usage: engine <repo-url>")
	// 	return
	// }

	// repoURL := os.Args[1]
	repoURL := "https://github.com/PriyanshuPz/edunotify.git"

	cfg := config.Config{
		BaseDir:        "./tmp",
		CacheEnabled:   true,
		CheckpointMode: true,
	}
	e := engine.New(&cfg)
	err := e.Run(repoURL)
	if err != nil {
		panic(err)
	}

	fmt.Println("Done")
}
