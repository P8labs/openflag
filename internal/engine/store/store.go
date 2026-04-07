package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"path/filepath"
	"sort"
	"time"

	"openflag/internal/engine/config"
	"openflag/internal/engine/scanner"

	_ "modernc.org/sqlite"
)

func dbPath(cfg *config.Config) string {
	return filepath.Join(cfg.BaseDir, "engine.db")
}

func EnsureDB(cfg *config.Config) error {
	db, err := sql.Open("sqlite", dbPath(cfg))
	if err != nil {
		return err
	}
	defer db.Close()

	schema := `
CREATE TABLE IF NOT EXISTS repo_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_url TEXT NOT NULL,
  repo_path TEXT NOT NULL,
  repo_root TEXT NOT NULL,
  frameworks TEXT NOT NULL,
  files_count INTEGER NOT NULL,
  languages_count INTEGER NOT NULL,
  graph_generated INTEGER NOT NULL,
  graph_files INTEGER NOT NULL,
  graph_functions INTEGER NOT NULL,
  graph_calls INTEGER NOT NULL,
  graph_imports INTEGER NOT NULL,
  graph_nodes INTEGER NOT NULL,
  graph_edges INTEGER NOT NULL,
  status TEXT NOT NULL,
  scanned_at TEXT NOT NULL
);
`

	if _, err := db.Exec(schema); err != nil {
		return err
	}

	return nil
}

func SaveRun(cfg *config.Config, repoURL, repoPath string, summary scanner.ScanSummary, status string) error {
	db, err := sql.Open("sqlite", dbPath(cfg))
	if err != nil {
		return err
	}
	defer db.Close()

	frameworks, err := json.Marshal(summary.Frameworks)
	if err != nil {
		return fmt.Errorf("marshal frameworks: %w", err)
	}

	query := `
INSERT INTO repo_runs (
  repo_url, repo_path, repo_root, frameworks,
  files_count, languages_count,
  graph_generated, graph_files, graph_functions, graph_calls, graph_imports, graph_nodes, graph_edges,
  status, scanned_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

	graphGenerated := 0
	if summary.GraphGenerated {
		graphGenerated = 1
	}

	_, err = db.Exec(
		query,
		repoURL,
		repoPath,
		summary.RepoRoot,
		string(frameworks),
		summary.Files,
		summary.Languages,
		graphGenerated,
		summary.Graph.Files,
		summary.Graph.Functions,
		summary.Graph.Calls,
		summary.Graph.Imports,
		summary.Graph.Nodes,
		summary.Graph.Edges,
		status,
		time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		return fmt.Errorf("insert run: %w", err)
	}

	return nil
}

type RepoRun struct {
	ID           int      `json:"id"`
	RepoURL      string   `json:"repoUrl"`
	RepoPath     string   `json:"repoPath"`
	RepoRoot     string   `json:"repoRoot"`
	Frameworks   []string `json:"frameworks"`
	FilesCount   int      `json:"filesCount"`
	Languages    int      `json:"languages"`
	GraphEnabled bool     `json:"graphGenerated"`
	GraphFiles   int      `json:"graphFiles"`
	GraphFns     int      `json:"graphFunctions"`
	GraphCalls   int      `json:"graphCalls"`
	GraphImports int      `json:"graphImports"`
	GraphNodes   int      `json:"graphNodes"`
	GraphEdges   int      `json:"graphEdges"`
	Status       string   `json:"status"`
	ScannedAt    string   `json:"scannedAt"`
}

func RecentRuns(cfg *config.Config, limit int) ([]RepoRun, error) {
	if limit <= 0 {
		limit = 20
	}

	db, err := sql.Open("sqlite", dbPath(cfg))
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query(`
SELECT id, repo_url, repo_path, repo_root, frameworks,
       files_count, languages_count,
       graph_generated, graph_files, graph_functions, graph_calls, graph_imports, graph_nodes, graph_edges,
       status, scanned_at
FROM repo_runs
ORDER BY id DESC
LIMIT ?
`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []RepoRun{}
	for rows.Next() {
		var run RepoRun
		var frameworksRaw string
		var graphGenerated int

		if err := rows.Scan(
			&run.ID,
			&run.RepoURL,
			&run.RepoPath,
			&run.RepoRoot,
			&frameworksRaw,
			&run.FilesCount,
			&run.Languages,
			&graphGenerated,
			&run.GraphFiles,
			&run.GraphFns,
			&run.GraphCalls,
			&run.GraphImports,
			&run.GraphNodes,
			&run.GraphEdges,
			&run.Status,
			&run.ScannedAt,
		); err != nil {
			return nil, err
		}

		run.GraphEnabled = graphGenerated == 1
		if frameworksRaw != "" {
			_ = json.Unmarshal([]byte(frameworksRaw), &run.Frameworks)
			sort.Strings(run.Frameworks)
		}

		out = append(out, run)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return out, nil
}
