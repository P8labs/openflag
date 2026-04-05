package config

import (
	"openflag/internal/engine/utils"
	"os"
	"path/filepath"
	"sync"
)

var (
	cfg  *Config
	once sync.Once
)

func Load() *Config {
	once.Do(func() {
		// home, _ := os.UserHomeDir()
		home, _ := os.Getwd()

		base := filepath.Join(home, "tmp")

		cfg = &Config{
			BaseDir:        base,
			CacheEnabled:   true,
			CheckpointMode: true,
		}
	})

	return cfg
}

type Config struct {
	BaseDir        string
	CacheEnabled   bool
	CheckpointMode bool
}

func DefaultConfig() *Config {
	home, _ := os.UserHomeDir()

	base := filepath.Join(home, ".openflag")

	return &Config{
		BaseDir:        base,
		CacheEnabled:   true,
		CheckpointMode: true,
	}
}

func (c *Config) RepoPath(repoURL string) string {
	return filepath.Join(c.BaseDir, "repos", utils.Hash(repoURL))
}

func (c *Config) CheckpointPath() string {
	return filepath.Join(c.BaseDir, "checkpoints")
}
