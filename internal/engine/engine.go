package engine

import (
	"openflag/internal/engine/config"
	"openflag/internal/engine/git"
	"openflag/internal/engine/scanner"
)

type Engine struct {
	cfg *config.Config
}

func New(cfg *config.Config) *Engine {
	return &Engine{cfg: cfg}
}

func (e *Engine) Run(repoURL string) error {
	path, err := git.CloneRepo(repoURL, e.cfg)
	if err != nil {
		return err
	}

	err = scanner.ScanRepo(path)
	if err != nil {
		return err
	}

	// checkpoint.SaveCheckpoint(e.cfg, "files", files)

	return nil
}
