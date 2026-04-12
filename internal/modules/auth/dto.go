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

type WakaTimeProject struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ActivityDay struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type ActivitySummaryResponse struct {
	CurrentStreak int           `json:"currentStreak"`
	LongestStreak int           `json:"longestStreak"`
	Days          []ActivityDay `json:"days"`
}

type PublicPostSummary struct {
	ID            string   `json:"id"`
	Content       string   `json:"content"`
	Category      string   `json:"category"`
	CreatedAt     string   `json:"createdAt"`
	DevlogMinutes *int     `json:"devlogMinutes,omitempty"`
	ProjectID     *string  `json:"projectId,omitempty"`
	ProjectTitle  *string  `json:"projectTitle,omitempty"`
	RefURLs       []string `json:"refUrls"`
}

type PublicProjectSummary struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	Status    string `json:"status"`
	LogoURL   string `json:"logoUrl"`
	CreatedAt string `json:"createdAt"`
}

type PublicUserProfileResponse struct {
	User struct {
		ID           string   `json:"id"`
		Name         string   `json:"name"`
		Username     string   `json:"username"`
		Image        *string  `json:"image,omitempty"`
		Bio          *string  `json:"bio,omitempty"`
		Skills       []string `json:"skills"`
		Interests    []string `json:"interests"`
		Availability *string  `json:"availability,omitempty"`
		LookingFor   *string  `json:"lookingFor,omitempty"`
	} `json:"user"`
	CurrentStreak    int                    `json:"currentStreak"`
	LongestStreak    int                    `json:"longestStreak"`
	TotalTrackedMins int                    `json:"totalTrackedMinutes"`
	RecentProjects   []PublicProjectSummary `json:"recentProjects"`
	RecentPosts      []PublicPostSummary    `json:"recentPosts"`
	ActivityDays     []ActivityDay          `json:"activityDays"`
}

type UpdateProfileRequest struct {
	Username     *string  `json:"username"`
	Bio          *string  `json:"bio"`
	Skills       []string `json:"skills"`
	Interests    []string `json:"interests"`
	Availability *string  `json:"availability"`
	LookingFor   *string  `json:"lookingFor"`
}

type NotificationItem struct {
	ID         string  `json:"id"`
	Type       string  `json:"type"`
	Message    string  `json:"message"`
	EntityType string  `json:"entityType"`
	EntityID   string  `json:"entityId"`
	CreatedAt  string  `json:"createdAt"`
	ReadAt     *string `json:"readAt,omitempty"`
	Actor      struct {
		ID       string  `json:"id"`
		Name     string  `json:"name"`
		Username string  `json:"username"`
		Image    *string `json:"image,omitempty"`
	} `json:"actor"`
}

type NotificationsResponse struct {
	Notifications []NotificationItem `json:"notifications"`
	UnreadCount   int                `json:"unreadCount"`
}
