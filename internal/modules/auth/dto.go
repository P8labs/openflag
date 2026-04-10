package auth

import "openflag/internal/models"

type ProviderName string

const (
	ProviderGitHub   ProviderName = "github"
	ProviderGoogle   ProviderName = "google"
	ProviderWakaTime ProviderName = "wakatime"
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

type Connections struct {
	GitHubConnected   bool `json:"githubConnected"`
	WakatimeConnected bool `json:"wakatimeConnected"`
}

type MeResponse struct {
	User        *models.User `json:"user"`
	Connections Connections  `json:"connections"`
}

type CompleteOnboardingStepRequest struct {
	Step           int      `json:"step"`
	Skip           bool     `json:"skip"`
	Username       *string  `json:"username"`
	Bio            *string  `json:"bio"`
	Skills         []string `json:"skills"`
	Interests      []string `json:"interests"`
	Availability   *string  `json:"availability"`
	LookingFor     *string  `json:"lookingFor"`
	WakatimeAPIKey *string  `json:"wakatimeApiKey"`
}
