package git

import (
	"fmt"
	"openflag/internal/engine/cache"
	"openflag/internal/engine/config"
	"os"
	"os/exec"
)

func CloneRepo(url string, cfg *config.Config) (string, error) {
	path := cfg.RepoPath(url)

	if cfg.CacheEnabled && cache.RepoExists(path) {
		fmt.Println("Using cached repo")
		return path, nil
	}

	fmt.Println("Cloning repo...")

	err := os.MkdirAll(path, os.ModePerm)
	if err != nil {
		return "", err
	}

	cmd := exec.Command("git", "clone", "--depth=1", url, path)
	err = cmd.Run()
	if err != nil {
		return "", err
	}

	return path, nil
}
