package engine

import (
	"openflag/internal/engine/config"
	"openflag/internal/engine/git"
	"openflag/internal/engine/scanner"
	"openflag/internal/engine/store"
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

	if err := store.EnsureDB(e.cfg); err != nil {
		return err
	}

	summary, err := scanner.ScanRepo(path)
	if err != nil {
		_ = store.SaveRun(e.cfg, repoURL, path, summary, "failed")
		return err
	}

	if err := store.SaveRun(e.cfg, repoURL, path, summary, "ok"); err != nil {
		return err
	}

	// checkpoint.SaveCheckpoint(e.cfg, "files", files)

	return nil
}
