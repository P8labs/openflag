package api

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	_ "embed"

	"openflag/internal/engine"
	"openflag/internal/engine/config"
	"openflag/internal/engine/scanner"
	"openflag/internal/engine/store"
)

//go:embed static/index.html
var indexHTML string

type Server struct {
	cfg *config.Config
}

func NewServer(cfg *config.Config) *Server {
	return &Server{cfg: cfg}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	checkpointsDir := s.cfg.CheckpointPath()
	mux.Handle("/artifacts/", http.StripPrefix("/artifacts/", http.FileServer(http.Dir(checkpointsDir))))

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, map[string]any{"ok": true})
	})
	mux.HandleFunc("/api/runs", s.handleRuns)
	mux.HandleFunc("/api/graph", s.handleGraph)
	mux.HandleFunc("/api/summary", s.handleSummary)
	mux.HandleFunc("/api/map", s.handleCodebaseMap)
	mux.HandleFunc("/api/analyze", s.handleAnalyze)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(indexHTML))
	})

	return withCORS(mux)
}

func (s *Server) handleRuns(w http.ResponseWriter, r *http.Request) {
	runs, err := store.RecentRuns(s.cfg, 30)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, runs)
}

func (s *Server) handleGraph(w http.ResponseWriter, r *http.Request) {
	graphPath := filepath.Join(s.cfg.CheckpointPath(), "function_graph.json")
	data, err := os.ReadFile(graphPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	var graph scanner.ExtractionGraph
	if err := json.Unmarshal(data, &graph); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, graph)
}

func (s *Server) handleSummary(w http.ResponseWriter, r *http.Request) {
	graphPath := filepath.Join(s.cfg.CheckpointPath(), "function_graph.json")
	data, err := os.ReadFile(graphPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	var graph scanner.ExtractionGraph
	if err := json.Unmarshal(data, &graph); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	byFeature := map[string]int{}
	for _, e := range graph.Edges {
		if strings.HasPrefix(e.To, "feature:") {
			byFeature[strings.TrimPrefix(e.To, "feature:")]++
		}
	}

	writeJSON(w, map[string]any{
		"metadata":      graph.Metadata,
		"entries":       graph.EntryPoints,
		"exits":         graph.ExitPoints,
		"features":      graph.Features,
		"featureCounts": byFeature,
	})
}

func (s *Server) handleCodebaseMap(w http.ResponseWriter, r *http.Request) {
	mapPath := filepath.Join(s.cfg.CheckpointPath(), "codebase_map.json")
	data, err := os.ReadFile(mapPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	var model scanner.CodebaseMap
	if err := json.Unmarshal(data, &model); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, model)
}

type analyzeRequest struct {
	RepoURL string `json:"repoUrl"`
}

func (s *Server) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req analyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}
	repoURL := strings.TrimSpace(req.RepoURL)
	if repoURL == "" {
		http.Error(w, "repoUrl is required", http.StatusBadRequest)
		return
	}

	e := engine.New(s.cfg)
	if err := e.Run(repoURL); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]any{"ok": true, "repoUrl": repoURL})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(v)
}
