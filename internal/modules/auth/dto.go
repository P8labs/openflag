package auth

import "openflag/internal/models"

type ProviderName string

const (
	ProviderGitHub ProviderName = "github"
	ProviderGoogle ProviderName = "google"
)

type LoginResponse struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

type ProviderProfile struct {
	ProviderAccountID string
	Name              string
	Email             string
	Image             string
	AccessToken       string
	RefreshToken      string
	ExpiresAt         *int64
}
