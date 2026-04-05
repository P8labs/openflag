package checkpoint

import (
	"encoding/json"
	"fmt"
	"openflag/internal/engine/config"
	"os"
	"path/filepath"
)

func SaveCheckpoint(cfg *config.Config, name string, data any) {
	if !cfg.CheckpointMode {
		return
	}

	dir := cfg.CheckpointPath()
	os.MkdirAll(dir, os.ModePerm)

	file := filepath.Join(dir, name+".json")

	f, err := os.Create(file)
	if err != nil {
		return
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	enc.Encode(data)

	fmt.Println("Checkpoint saved:", file)
}
