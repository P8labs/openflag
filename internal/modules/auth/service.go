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
	"sort"
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
const usernameChangeCooldown = 7 * 24 * time.Hour

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
			Scopes:       []string{"read:user", "user:email", "public_repo"},
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

func (s *Service) Callback(ctx context.Context, provider, code string, currentUserID string) (*AuthResponse, error) {
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

	var user *models.User
	if strings.TrimSpace(currentUserID) != "" {
		linkedUser, err := s.repo.FindUserByProvider(ctx, provider, profile.ProviderAccountID)
		if err == nil && linkedUser.ID != currentUserID {
			return nil, errors.New("this provider account is already connected to another user")
		}
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}

		user, err = s.repo.FindUserByID(ctx, currentUserID)
		if err != nil {
			return nil, err
		}
	} else {
		usernameFromEmail := strings.Split(profile.Email, "@")[0] + "_" + randomString(6)

		user = &models.User{
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

func (s *Service) ActivitySummary(ctx context.Context, userID string, days int) (*ActivitySummaryResponse, error) {
	if days <= 0 {
		today := time.Now().UTC().Truncate(24 * time.Hour)
		if today.Year()%4 == 0 && (today.Year()%100 != 0 || today.Year()%400 == 0) {
			days = 366
		} else {
			days = 365
		}
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	since := today.AddDate(0, 0, -(days - 1))

	activities, err := s.repo.ListUserActivitiesSince(ctx, userID, since)
	if err != nil {
		return nil, err
	}

	activityMap := map[string]int{}
	for _, day := range activities {
		key := day.ActivityDate.UTC().Format("2006-01-02")
		activityMap[key] = day.Count
	}

	response := &ActivitySummaryResponse{
		Days: make([]ActivityDay, 0, days),
	}

	for i := 0; i < days; i++ {
		date := since.AddDate(0, 0, i)
		key := date.Format("2006-01-02")
		response.Days = append(response.Days, ActivityDay{Date: key, Count: activityMap[key]})
	}

	response.CurrentStreak, response.LongestStreak = computeStreaks(response.Days)

	return response, nil
}

func (s *Service) PublicProfile(ctx context.Context, username string) (*PublicUserProfileResponse, error) {
	user, err := s.repo.FindUserByUsername(ctx, strings.TrimSpace(username))
	if err != nil {
		return nil, err
	}

	projects, err := s.repo.ListRecentProjectsByOwner(ctx, user.ID, 6)
	if err != nil {
		return nil, err
	}

	posts, err := s.repo.ListRecentPostsByAuthor(ctx, user.ID, 8)
	if err != nil {
		return nil, err
	}

	totalTracked, err := s.repo.SumTrackedMinutesByUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	activity, err := s.ActivitySummary(ctx, user.ID, 84)
	if err != nil {
		return nil, err
	}

	profile := &PublicUserProfileResponse{
		CurrentStreak:    activity.CurrentStreak,
		LongestStreak:    activity.LongestStreak,
		TotalTrackedMins: totalTracked,
		RecentProjects:   make([]PublicProjectSummary, 0, len(projects)),
		RecentPosts:      make([]PublicPostSummary, 0, len(posts)),
		ActivityDays:     activity.Days,
	}

	profile.User.ID = user.ID
	profile.User.Name = user.Name
	profile.User.Username = user.Username
	profile.User.Image = user.Image
	profile.User.Bio = user.Bio
	profile.User.Skills = []string(user.Skills)
	profile.User.Interests = []string(user.Interests)
	profile.User.Availability = user.Availability
	profile.User.LookingFor = user.LookingFor

	for _, project := range projects {
		logo := "?"
		if project.LogoURL != nil && strings.TrimSpace(*project.LogoURL) != "" {
			logo = *project.LogoURL
		}
		profile.RecentProjects = append(profile.RecentProjects, PublicProjectSummary{
			ID:        project.ID,
			Title:     project.Title,
			Summary:   project.Summary,
			Status:    project.Status,
			LogoURL:   logo,
			CreatedAt: project.CreatedAt.UTC().Format(time.RFC3339),
		})
	}

	for _, post := range posts {
		var projectID *string
		var projectTitle *string
		if post.Project != nil {
			projectID = &post.Project.ID
			projectTitle = &post.Project.Title
		}

		profile.RecentPosts = append(profile.RecentPosts, PublicPostSummary{
			ID:            post.ID,
			Content:       post.Content,
			Category:      post.Category,
			CreatedAt:     post.CreatedAt.UTC().Format(time.RFC3339),
			DevlogMinutes: post.DevlogMinutes,
			ProjectID:     projectID,
			ProjectTitle:  projectTitle,
			RefURLs:       []string(post.RefURLs),
		})
	}

	return profile, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, input UpdateProfileRequest) (*MeResponse, error) {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}

	if input.Username != nil {
		nextUsername := strings.TrimSpace(*input.Username)
		if nextUsername == "" {
			return nil, errors.New("username is required")
		}
		if !usernamePattern.MatchString(nextUsername) {
			return nil, errors.New("username must be 3-30 chars and only letters, numbers, _ or .")
		}

		if !strings.EqualFold(nextUsername, user.Username) {
			if user.UsernameChangedAt != nil {
				nextAllowed := user.UsernameChangedAt.Add(usernameChangeCooldown)
				if time.Now().UTC().Before(nextAllowed) {
					return nil, fmt.Errorf("username can be changed again after %s", nextAllowed.Format("2006-01-02"))
				}
			}

			existing, findErr := s.repo.FindUserByUsername(ctx, nextUsername)
			if findErr == nil && existing.ID != userID {
				return nil, errors.New("username is already taken")
			}
			if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
				return nil, findErr
			}

			now := time.Now().UTC()
			updates["username"] = nextUsername
			updates["username_changed_at"] = now
		}
	}

	if input.Bio != nil {
		value := strings.TrimSpace(*input.Bio)
		updates["bio"] = nullableString(value)
	}

	if input.Availability != nil {
		value := strings.TrimSpace(*input.Availability)
		updates["availability"] = nullableString(value)
	}

	if input.LookingFor != nil {
		value := strings.TrimSpace(*input.LookingFor)
		updates["looking_for"] = nullableString(value)
	}

	if input.Skills != nil {
		updates["skills"] = pq.StringArray(normalizeStringList(input.Skills))
	}

	if input.Interests != nil {
		updates["interests"] = pq.StringArray(normalizeStringList(input.Interests))
	}

	if len(updates) > 0 {
		if err := s.repo.db.WithContext(ctx).Model(user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	updatedUser, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	connections, err := s.Connections(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &MeResponse{User: updatedUser, Connections: connections}, nil
}

func (s *Service) Explore(ctx context.Context, userID string, query string, filter string, limit int, offset int) (*ExploreResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	normalizedQuery := strings.TrimSpace(query)
	normalizedFilter := strings.ToLower(strings.TrimSpace(filter))
	if normalizedFilter == "" {
		normalizedFilter = "all"
	}

	includeProjects := true
	includeUsers := true
	projectMode := "search"
	userMode := "search"
	terms := []string{}

	if normalizedQuery == "" {
		switch normalizedFilter {
		case "projects":
			includeUsers = false
			projectMode = "trending"
		case "users":
			includeProjects = false
			userMode = "trending"
		case "recent":
			projectMode = "recent"
			userMode = "recent"
		case "skill-match", "interest-match":
			currentUser, err := s.repo.FindUserByID(ctx, userID)
			if err != nil {
				return nil, err
			}

			if normalizedFilter == "skill-match" {
				terms = normalizeStringList([]string(currentUser.Skills))
				projectMode = "skill-match"
				userMode = "skill-match"
			} else {
				terms = normalizeStringList([]string(currentUser.Interests))
				projectMode = "interest-match"
				userMode = "interest-match"
			}

			if len(terms) == 0 {
				projectMode = "trending"
				userMode = "trending"
			}
		default:
			projectMode = "trending"
			userMode = "trending"
		}
	} else {
		switch normalizedFilter {
		case "projects":
			includeUsers = false
		case "users":
			includeProjects = false
		}
	}

	response := &ExploreResponse{
		Query:      normalizedQuery,
		Filter:     normalizedFilter,
		Projects:   []ExploreProjectItem{},
		Users:      []ExploreUserItem{},
		HasMore:    false,
		NextOffset: offset,
	}

	if includeProjects {
		projects, hasMore, err := s.repo.ListExploreProjects(ctx, normalizedQuery, projectMode, terms, limit, offset)
		if err != nil {
			return nil, err
		}
		response.HasMore = response.HasMore || hasMore

		response.Projects = make([]ExploreProjectItem, 0, len(projects))
		for _, project := range projects {
			item := ExploreProjectItem{
				ID:        project.ID,
				Title:     project.Title,
				Summary:   project.Summary,
				Status:    project.Status,
				Tags:      []string(project.Tags),
				UpdatedAt: project.UpdatedAt.UTC().Format(time.RFC3339),
			}

			item.Owner.ID = project.Owner.ID
			item.Owner.Name = project.Owner.Name
			item.Owner.Username = project.Owner.Username
			item.Owner.Image = project.Owner.Image
			item.Owner.Skills = []string(project.Owner.Skills)
			item.Owner.Interests = []string(project.Owner.Interests)

			response.Projects = append(response.Projects, item)
		}
	}

	if includeUsers {
		users, hasMore, err := s.repo.ListExploreUsers(ctx, normalizedQuery, userMode, terms, limit, offset)
		if err != nil {
			return nil, err
		}
		response.HasMore = response.HasMore || hasMore

		response.Users = make([]ExploreUserItem, 0, len(users))
		for _, user := range users {
			response.Users = append(response.Users, ExploreUserItem{
				ID:        user.ID,
				Name:      user.Name,
				Username:  user.Username,
				Image:     user.Image,
				Bio:       user.Bio,
				Skills:    []string(user.Skills),
				Interests: []string(user.Interests),
			})
		}
	}

	if response.HasMore {
		response.NextOffset = offset + limit
	}

	return response, nil
}

func (s *Service) Notifications(ctx context.Context, userID string, limit int, offset int) (*NotificationsResponse, error) {
	notifications, err := s.repo.ListNotifications(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	unreadCount, err := s.repo.CountUnreadNotifications(ctx, userID)
	if err != nil {
		return nil, err
	}

	response := &NotificationsResponse{
		Notifications: make([]NotificationItem, 0, len(notifications)),
		UnreadCount:   int(unreadCount),
	}

	for _, notification := range notifications {
		item := NotificationItem{
			ID:         notification.ID,
			Type:       notification.Type,
			Message:    notification.Message,
			EntityType: notification.EntityType,
			EntityID:   notification.EntityID,
			CreatedAt:  notification.CreatedAt.UTC().Format(time.RFC3339),
		}
		if notification.ReadAt != nil {
			value := notification.ReadAt.UTC().Format(time.RFC3339)
			item.ReadAt = &value
		}

		if notification.Actor != nil {
			item.Actor.ID = notification.Actor.ID
			item.Actor.Name = notification.Actor.Name
			item.Actor.Username = notification.Actor.Username
			item.Actor.Image = notification.Actor.Image
		}

		response.Notifications = append(response.Notifications, item)
	}

	return response, nil
}

func (s *Service) UnreadNotificationCount(ctx context.Context, userID string) (int, error) {
	unreadCount, err := s.repo.CountUnreadNotifications(ctx, userID)
	if err != nil {
		return 0, err
	}

	return int(unreadCount), nil
}

func (s *Service) MarkAllNotificationsRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllNotificationsRead(ctx, userID)
}

func computeStreaks(days []ActivityDay) (int, int) {
	if len(days) == 0 {
		return 0, 0
	}

	copyDays := append([]ActivityDay(nil), days...)
	sort.Slice(copyDays, func(i, j int) bool {
		return copyDays[i].Date < copyDays[j].Date
	})

	longest := 0
	running := 0
	for _, day := range copyDays {
		if day.Count > 0 {
			running++
			if running > longest {
				longest = running
			}
		} else {
			running = 0
		}
	}

	current := 0
	for index := len(copyDays) - 1; index >= 0; index-- {
		if copyDays[index].Count <= 0 {
			break
		}
		current++
	}

	return current, longest
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

func (s *Service) WakaTimeProjects(ctx context.Context, userID string) ([]WakaTimeProject, error) {
	account, err := s.repo.FindOAuthAccountByUserAndProvider(ctx, userID, string(ProviderWakaTime))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("wakatime is not connected")
		}
		return nil, err
	}

	apiKey := strings.TrimSpace(account.AccessToken)
	if apiKey == "" {
		return nil, errors.New("wakatime api key is missing")
	}

	return s.fetchWakatimeProjects(ctx, apiKey)
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
		if user.Username == "" || !strings.EqualFold(user.Username, username) {
			now := time.Now().UTC()
			updates["username_changed_at"] = now
		}
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

type wakatimeProjectsResponse struct {
	Data []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
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

func (s *Service) fetchWakatimeProjects(ctx context.Context, apiKey string) ([]WakaTimeProject, error) {
	endpoint := "https://wakatime.com/api/v1/users/current/projects?api_key=" + url.QueryEscape(apiKey)
	var payload wakatimeProjectsResponse
	if err := getJSON(ctx, s.httpClient, endpoint, &payload); err != nil {
		return nil, errors.New("unable to fetch wakatime projects")
	}

	projects := make([]WakaTimeProject, 0, len(payload.Data))
	for _, item := range payload.Data {
		name := strings.TrimSpace(item.Name)
		if name == "" {
			continue
		}

		id := strings.TrimSpace(item.ID)
		if id == "" {
			id = name
		}

		projects = append(projects, WakaTimeProject{
			ID:   id,
			Name: name,
		})
	}

	return projects, nil
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
