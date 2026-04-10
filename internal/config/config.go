package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	BaseURL            string
	FrontendURL        string
	GitHubClientID     string
	GitHubClientSecret string
	GoogleClientID     string
	GoogleClientSecret string
	CookieDomain       string
	Environment        string
}

func Load() Config {
	_ = godotenv.Load()

	cfg := Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		BaseURL:            getEnv("BASE_URL", "http://localhost:8080"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		CookieDomain:       strings.TrimSpace(os.Getenv("COOKIE_DOMAIN")),
		Environment:        getEnv("ENVIRONMENT", "development"),
	}

	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "change-me-in-production"
	}

	if cfg.DatabaseURL == "" {
		panic(fmt.Errorf("DATABASE_URL is required"))
	}

	return cfg
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}
