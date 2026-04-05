package cache

import (
	"os"
)

func RepoExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
