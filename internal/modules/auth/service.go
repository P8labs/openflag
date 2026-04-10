package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"openflag/internal/config"
	"openflag/internal/models"

	"github.com/lib/pq"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
	gorm "gorm.io/gorm"
)

var ErrInvalidProvider = errors.New("invalid oauth provider")

var usernamePattern = regexp.MustCompile(`^[a-zA-Z0-9_\.]{3,30}$`)

const sessionDuration = 24 * time.Hour

type Service struct {
	repo       *Repository
	cfg        config.Config
	providers  map[string]*oauth2.Config
	httpClient *http.Client
}

func NewService(repo *Repository, cfg config.Config) *Service {
	providers := map[string]*oauth2.Config{}

	if cfg.GitHubClientID != "" && cfg.GitHubClientSecret != "" {
		providers[string(ProviderGitHub)] = &oauth2.Config{
			ClientID:     cfg.GitHubClientID,
			ClientSecret: cfg.GitHubClientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/v1/auth/github/callback", strings.TrimRight(cfg.BaseURL, "/")),
			Scopes:       []string{"read:user", "user:email"},
			Endpoint:     github.Endpoint,
		}
	}

	if cfg.GoogleClientID != "" && cfg.GoogleClientSecret != "" {
		providers[string(ProviderGoogle)] = &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/v1/auth/google/callback", strings.TrimRight(cfg.BaseURL, "/")),
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		}
	}

	return &Service{
		repo:       repo,
		cfg:        cfg,
		providers:  providers,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Service) LoginURL(provider string) (LoginResponse, error) {
	cfg, ok := s.providers[provider]
	if !ok {
		return LoginResponse{}, ErrInvalidProvider
	}

	state, err := randomState()
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{AuthURL: cfg.AuthCodeURL(state, oauth2.AccessTypeOffline), State: state}, nil
}

func (s *Service) Callback(ctx context.Context, provider, code string) (*AuthResponse, error) {
	cfg, ok := s.providers[provider]
	if !ok {
		return nil, ErrInvalidProvider
	}

	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	profile, err := s.fetchProfile(ctx, provider, token)
	if err != nil {
		return nil, err
	}

	if profile.Email == "" {
		return nil, errors.New("oauth provider did not return an email address")
	}

	name := strings.TrimSpace(profile.Name)
	if name == "" {
		name = strings.Split(profile.Email, "@")[0]
	}

	usernameFromEmail := strings.Split(profile.Email, "@")[0] + "_" + randomString(6)

	user := &models.User{
		Name:     name,
		Email:    profile.Email,
		Image:    &profile.Image,
		Username: usernameFromEmail,
	}

	if existing, findErr := s.repo.FindUserByProvider(ctx, provider, profile.ProviderAccountID); findErr == nil {
		user = existing
		if err := s.repo.db.WithContext(ctx).Model(user).Updates(map[string]any{"name": name, "image": profile.Image}).Error; err != nil {
			return nil, err
		}
	} else if errors.Is(findErr, gorm.ErrRecordNotFound) {
		if byEmail, emailErr := s.repo.FindUserByEmail(ctx, profile.Email); emailErr == nil {
			user = byEmail
			if err := s.repo.db.WithContext(ctx).Model(user).Updates(map[string]any{"name": name, "image": profile.Image}).Error; err != nil {
				return nil, err
			}
		} else if !errors.Is(emailErr, gorm.ErrRecordNotFound) {
			return nil, emailErr
		}
	} else {
		return nil, findErr
	}

	account := &models.OAuthAccount{
		Provider:          provider,
		ProviderAccountID: profile.ProviderAccountID,
		AccessToken:       profile.AccessToken,
		RefreshToken:      profile.RefreshToken,
	}
	if profile.ExpiresAt != nil {
		expiresAt := time.Unix(*profile.ExpiresAt, 0)
		account.ExpiresAt = &expiresAt
	}

	if err := s.repo.UpsertUserWithAccount(ctx, user, account); err != nil {
		return nil, err
	}

	tokenString, err := s.createSession(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{Token: tokenString, User: user}, nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil
	}

	return s.repo.RevokeSessionByToken(ctx, token)
}

func (s *Service) Me(ctx context.Context, userID string) (*models.User, error) {
	return s.repo.FindUserByID(ctx, userID)
}

func (s *Service) Connections(ctx context.Context, userID string) (Connections, error) {
	githubConnected, err := s.repo.HasProviderConnection(ctx, userID, string(ProviderGitHub))
	if err != nil {
		return Connections{}, err
	}

	wakatimeConnected, err := s.repo.HasProviderConnection(ctx, userID, string(ProviderWakaTime))
	if err != nil {
		return Connections{}, err
	}

	return Connections{
		GitHubConnected:   githubConnected,
		WakatimeConnected: wakatimeConnected,
	}, nil
}

func (s *Service) CompleteOnboardingStep(ctx context.Context, userID string, input CompleteOnboardingStepRequest) (*MeResponse, error) {
	if input.Step < 1 || input.Step > 3 {
		return nil, errors.New("step must be between 1 and 3")
	}

	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}

	switch input.Step {
	case 1:
		if input.Skip {
			return nil, errors.New("step 1 is required")
		}

		username, bio, err := s.validateStepOne(ctx, user.ID, input)
		if err != nil {
			return nil, err
		}

		updates["username"] = username
		updates["bio"] = bio
		updates["skills"] = pq.StringArray(normalizeStringList(input.Skills))
		updates["interests"] = pq.StringArray(normalizeStringList(input.Interests))
	case 2:
		if input.Availability != nil {
			value := strings.TrimSpace(*input.Availability)
			updates["availability"] = nullableString(value)
		}
		if input.LookingFor != nil {
			value := strings.TrimSpace(*input.LookingFor)
			updates["looking_for"] = nullableString(value)
		}
	case 3:
		if input.WakatimeAPIKey != nil {
			apiKey := strings.TrimSpace(*input.WakatimeAPIKey)
			if apiKey != "" {
				profile, err := s.fetchWakatimeProfile(ctx, apiKey)
				if err != nil {
					return nil, err
				}

				if err := s.repo.UpsertProviderConnection(ctx, &models.OAuthAccount{
					UserID:            user.ID,
					Provider:          string(ProviderWakaTime),
					ProviderAccountID: profile.Data.ID,
					AccessToken:       apiKey,
					RefreshToken:      "",
				}); err != nil {
					return nil, err
				}
			}
		}
	}

	nextState := min(user.OnboardState+1, 3)
	updates["onboard_state"] = nextState

	if err := s.repo.db.WithContext(ctx).Model(user).Updates(updates).Error; err != nil {
		return nil, err
	}

	updatedUser, err := s.repo.FindUserByID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	connections, err := s.Connections(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &MeResponse{User: updatedUser, Connections: connections}, nil
}

func (s *Service) validateStepOne(ctx context.Context, userID string, input CompleteOnboardingStepRequest) (string, string, error) {
	if input.Username == nil || input.Bio == nil {
		return "", "", errors.New("username and bio are required")
	}

	username := strings.TrimSpace(*input.Username)
	bio := strings.TrimSpace(*input.Bio)

	if username == "" || bio == "" {
		return "", "", errors.New("username and bio are required")
	}

	if !usernamePattern.MatchString(username) {
		return "", "", errors.New("username must be 3-30 chars and only letters, numbers, _ or .")
	}

	existing, err := s.repo.FindUserByUsername(ctx, username)
	if err == nil && existing.ID != userID {
		return "", "", errors.New("username is already taken")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return "", "", err
	}

	return username, bio, nil
}

func (s *Service) createSession(ctx context.Context, userID string) (string, error) {
	// IDK why I am doing this 3 times, but just in case of a random collision, we can retry a few times before giving up
	// or for fun
	for range 3 {
		token, err := randomState()
		if err != nil {
			return "", err
		}

		session := &models.Session{
			UserID:    userID,
			Token:     token,
			ExpiresAt: time.Now().Add(sessionDuration),
		}

		if err := s.repo.CreateSession(ctx, session); err == nil {
			return token, nil
		}
	}

	return "", errors.New("failed to create session")
}

func (s *Service) fetchProfile(ctx context.Context, provider string, token *oauth2.Token) (*ProviderProfile, error) {
	client := oauth2.NewClient(ctx, oauth2.StaticTokenSource(token))

	switch provider {
	case string(ProviderGitHub):
		return s.fetchGitHubProfile(ctx, client, token)
	case string(ProviderGoogle):
		return s.fetchGoogleProfile(ctx, client, token)
	default:
		return nil, ErrInvalidProvider
	}
}

func (s *Service) fetchGitHubProfile(ctx context.Context, client *http.Client, token *oauth2.Token) (*ProviderProfile, error) {
	var profile struct {
		ID        int64  `json:"id"`
		Name      string `json:"name"`
		Login     string `json:"login"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := getJSON(ctx, client, "https://api.github.com/user", &profile); err != nil {
		return nil, err
	}

	email := strings.TrimSpace(profile.Email)
	if email == "" {
		var emails []struct {
			Email    string `json:"email"`
			Primary  bool   `json:"primary"`
			Verified bool   `json:"verified"`
		}
		if err := getJSON(ctx, client, "https://api.github.com/user/emails", &emails); err == nil {
			for _, item := range emails {
				if item.Primary && item.Verified {
					email = item.Email
					break
				}
			}
		}
	}

	return &ProviderProfile{
		ProviderAccountID: fmt.Sprintf("%d", profile.ID),
		Name:              firstNonEmpty(profile.Name, profile.Login),
		Email:             email,
		Image:             profile.AvatarURL,
		AccessToken:       token.AccessToken,
		RefreshToken:      token.RefreshToken,
		ExpiresAt:         tokenExpiryUnix(token),
	}, nil
}

func (s *Service) fetchGoogleProfile(ctx context.Context, client *http.Client, token *oauth2.Token) (*ProviderProfile, error) {
	var profile struct {
		ID      string `json:"id"`
		Name    string `json:"name"`
		Email   string `json:"email"`
		Picture string `json:"picture"`
	}

	if err := getJSON(ctx, client, "https://www.googleapis.com/oauth2/v2/userinfo", &profile); err != nil {
		return nil, err
	}

	return &ProviderProfile{
		ProviderAccountID: profile.ID,
		Name:              profile.Name,
		Email:             profile.Email,
		Image:             profile.Picture,
		AccessToken:       token.AccessToken,
		RefreshToken:      token.RefreshToken,
		ExpiresAt:         tokenExpiryUnix(token),
	}, nil
}

func randomState() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func getJSON(ctx context.Context, client *http.Client, url string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		return errors.New(strings.TrimSpace(string(body)))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}

	return ""
}

func tokenExpiryUnix(token *oauth2.Token) *int64 {
	if token == nil || token.Expiry.IsZero() {
		return nil
	}

	value := token.Expiry.Unix()
	return &value
}

type wakatimeCurrentUserResponse struct {
	Data struct {
		ID string `json:"id"`
	} `json:"data"`
}

func (s *Service) fetchWakatimeProfile(ctx context.Context, apiKey string) (*wakatimeCurrentUserResponse, error) {
	endpoint := "https://wakatime.com/api/v1/users/current?api_key=" + url.QueryEscape(apiKey)
	var payload wakatimeCurrentUserResponse
	if err := getJSON(ctx, s.httpClient, endpoint, &payload); err != nil {
		return nil, errors.New("invalid wakatime api key")
	}

	if strings.TrimSpace(payload.Data.ID) == "" {
		return nil, errors.New("invalid wakatime api key")
	}

	return &payload, nil
}

func nullableString(value string) any {
	if value == "" {
		return nil
	}

	return value
}

func normalizeStringList(input []string) []string {
	if len(input) == 0 {
		return []string{}
	}

	items := make([]string, 0, len(input))
	seen := map[string]struct{}{}
	for _, raw := range input {
		value := strings.TrimSpace(raw)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		items = append(items, value)
		if len(items) == 16 {
			break
		}
	}

	return items
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		// skip randomization on error, fallback to timestamp-based string
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}

	for i, b := range bytes {
		bytes[i] = charset[b%byte(len(charset))]
	}

	return string(bytes)
}
