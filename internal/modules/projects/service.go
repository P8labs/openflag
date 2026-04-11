package projects

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"openflag/internal/models"

	"gorm.io/gorm"
)

var (
	ErrProjectNotFound      = errors.New("project not found")
	ErrProjectForbidden     = errors.New("forbidden")
	ErrProjectInvalidStatus = errors.New("invalid project status")
)

const (
	ProjectStatusDev       = "dev"
	ProjectStatusLive      = "live"
	ProjectStatusPrototype = "prototype"
)

type Service struct {
	repo       *Repository
	db         *gorm.DB
	httpClient *http.Client
}

type githubPullRequest struct {
	Number  int    `json:"number"`
	Title   string `json:"title"`
	HTMLURL string `json:"html_url"`
}

type githubIssue struct {
	Number      int    `json:"number"`
	Title       string `json:"title"`
	HTMLURL     string `json:"html_url"`
	PullRequest *struct {
		URL string `json:"url"`
	} `json:"pull_request"`
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{
		repo:       repo,
		db:         db,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Service) List(ctx context.Context) ([]models.Project, error) {
	return s.repo.List(ctx)
}

func (s *Service) Get(ctx context.Context, id string) (*models.Project, error) {
	project, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, mapProjectErr(err)
	}

	return project, nil
}

func (s *Service) Create(ctx context.Context, ownerID string, input CreateRequest) (*models.Project, error) {
	title := strings.TrimSpace(input.Title)
	description := strings.TrimSpace(input.Description)
	summary := strings.TrimSpace(input.Summary)
	if title == "" || description == "" || summary == "" {
		return nil, errors.New("title, description, and summary are required")
	}

	status, err := normalizeProjectStatus(input.Status)
	if err != nil {
		return nil, err
	}

	project := &models.Project{
		OwnerID:     ownerID,
		Title:       title,
		Status:      status,
		Description: description,
		Summary:     summary,
		Url:         stringPtr(strings.TrimSpace(input.ProjectURL)),
		Image:       stringPtr(strings.TrimSpace(input.ImageURL)),
		Video:       stringPtr(strings.TrimSpace(input.VideoURL)),
		GitHubURL:   stringPtr(strings.TrimSpace(input.GitHubURL)),
		WakatimeIDs: input.WakatimeIDs,
		Tags:        normalizeTags(input.Tags),
	}

	if err := s.repo.Create(ctx, project); err != nil {
		return nil, err
	}

	return s.repo.FindByID(ctx, project.ID)
}

func (s *Service) Update(ctx context.Context, id string, ownerID string, input UpdateRequest) (*models.Project, error) {
	project, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, mapProjectErr(err)
	}

	if project.OwnerID != ownerID {
		return nil, ErrProjectForbidden
	}

	updates := map[string]any{}
	setNonEmptyTrimmed(updates, "title", input.Title)
	if err := setProjectStatus(updates, input.Status); err != nil {
		return nil, err
	}
	setNonEmptyTrimmed(updates, "description", input.Description)
	setNullableTrimmed(updates, "url", input.ProjectURL)
	setNullableTrimmed(updates, "image", firstProvided(input.ImageURL, input.Image))
	setNullableTrimmed(updates, "video", firstProvided(input.VideoURL, input.Video))
	setNullableTrimmed(updates, "github_url", input.GitHubURL)
	setNullableTrimmed(updates, "wakatime_id", input.WakatimeID)
	if input.Tags != nil {
		updates["tags"] = normalizeTags(*input.Tags)
	}

	if len(updates) == 0 {
		return project, nil
	}

	updated, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *Service) Delete(ctx context.Context, id string, ownerID string) error {
	project, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return mapProjectErr(err)
	}

	if project.OwnerID != ownerID {
		return ErrProjectForbidden
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) TrackedMinutes(ctx context.Context, id string, userID string) (int, error) {
	project, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return 0, mapProjectErr(err)
	}

	if len(project.WakatimeIDs) == 0 {
		return 0, nil
	}

	var account models.OAuthAccount
	if err := s.db.WithContext(ctx).
		First(&account, "user_id = ? AND provider = ?", userID, "wakatime").
		Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, errors.New("wakatime is not connected")
		}
		return 0, err
	}

	apiKey := strings.TrimSpace(account.AccessToken)
	if apiKey == "" {
		return 0, errors.New("wakatime api key is missing")
	}

	minutes, err := s.fetchWakaTimeTrackedMinutes(ctx, apiKey, project.WakatimeIDs)
	if err != nil {
		return 0, err
	}

	return minutes, nil
}

func (s *Service) GitHubReferences(ctx context.Context, userID string, repoURL string) (*GitHubReferencesResponse, error) {
	owner, repo, err := parseGitHubRepo(repoURL)
	if err != nil {
		return nil, err
	}

	var account models.OAuthAccount
	if err := s.db.WithContext(ctx).
		First(&account, "user_id = ? AND provider = ?", userID, "github").
		Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("github is not connected")
		}
		return nil, err
	}

	token := strings.TrimSpace(account.AccessToken)
	if token == "" {
		return nil, errors.New("github access token is missing")
	}

	prsEndpoint := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls?state=all&per_page=25", url.PathEscape(owner), url.PathEscape(repo))
	issuesEndpoint := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues?state=all&per_page=25", url.PathEscape(owner), url.PathEscape(repo))

	var pulls []githubPullRequest
	if err := getGitHubJSON(ctx, s.httpClient, prsEndpoint, token, &pulls); err != nil {
		return nil, err
	}

	var issuePayload []githubIssue
	if err := getGitHubJSON(ctx, s.httpClient, issuesEndpoint, token, &issuePayload); err != nil {
		return nil, err
	}

	refs := &GitHubReferencesResponse{
		Owner:  owner,
		Repo:   repo,
		PRs:    make([]GitHubReference, 0, len(pulls)),
		Issues: make([]GitHubReference, 0, len(issuePayload)),
	}

	for _, pr := range pulls {
		if pr.Number <= 0 {
			continue
		}
		refs.PRs = append(refs.PRs, GitHubReference{
			Number: pr.Number,
			Title:  strings.TrimSpace(pr.Title),
			URL:    strings.TrimSpace(pr.HTMLURL),
		})
	}

	for _, issue := range issuePayload {
		if issue.PullRequest != nil {
			continue
		}
		if issue.Number <= 0 {
			continue
		}
		refs.Issues = append(refs.Issues, GitHubReference{
			Number: issue.Number,
			Title:  strings.TrimSpace(issue.Title),
			URL:    strings.TrimSpace(issue.HTMLURL),
		})
	}

	return refs, nil
}

func mapProjectErr(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrProjectNotFound
	}

	return err
}

func normalizeTags(input []string) []string {
	if len(input) == 0 {
		return []string{}
	}

	tags := make([]string, 0, len(input))
	seen := map[string]struct{}{}
	for _, item := range input {
		value := strings.TrimSpace(item)
		if value == "" {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		tags = append(tags, value)
		if len(tags) == 16 {
			break
		}
	}

	return tags
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func nullableString(s string) any {
	if s == "" {
		return nil
	}

	return s
}

func setNonEmptyTrimmed(updates map[string]any, key string, value *string) {
	if value == nil {
		return
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return
	}

	updates[key] = trimmed
}

func setNullableTrimmed(updates map[string]any, key string, value *string) {
	if value == nil {
		return
	}

	updates[key] = nullableString(strings.TrimSpace(*value))
}

func firstProvided(values ...*string) *string {
	for _, value := range values {
		if value != nil {
			return value
		}
	}

	return nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}

	return ""
}

func normalizeProjectStatus(value string) (string, error) {
	status := strings.ToLower(strings.TrimSpace(value))
	if status == "" {
		return ProjectStatusDev, nil
	}

	switch status {
	case ProjectStatusDev, ProjectStatusLive, ProjectStatusPrototype:
		return status, nil
	default:
		return "", ErrProjectInvalidStatus
	}
}

func setProjectStatus(updates map[string]any, value *string) error {
	if value == nil {
		return nil
	}

	status, err := normalizeProjectStatus(*value)
	if err != nil {
		return err
	}

	updates["status"] = status
	return nil
}

type wakatimeSummariesResponse struct {
	Data []struct {
		Projects []struct {
			Name         string  `json:"name"`
			TotalSeconds float64 `json:"total_seconds"`
		} `json:"projects"`
	} `json:"data"`
}

type wakatimeAllTimeResponse struct {
	Data struct {
		TotalSeconds float64 `json:"total_seconds"`
	} `json:"data"`
}

func (s *Service) fetchWakaTimeLifetimeMinutesByProjectID(ctx context.Context, apiKey string, projectID string) (int, error) {
	cleanProjectID := strings.TrimSpace(projectID)
	if cleanProjectID == "" {
		return 0, nil
	}

	endpoint := "https://wakatime.com/api/v1/users/current/all_time_since_today?project=" +
		url.QueryEscape(cleanProjectID) +
		"&api_key=" +
		url.QueryEscape(apiKey)

	var payload wakatimeAllTimeResponse
	if err := getJSON(ctx, s.httpClient, endpoint, &payload); err != nil {
		return 0, fmt.Errorf("unable to fetch wakatime lifetime tracked time for project %q: %w", cleanProjectID, err)
	}

	return int(payload.Data.TotalSeconds / 60), nil
}

func (s *Service) fetchWakaTimeTrackedMinutes(ctx context.Context, apiKey string, projectIDs []string) (int, error) {
	if len(projectIDs) == 0 {
		return 0, nil
	}

	totalMinutes := 0
	seen := map[string]struct{}{}
	for _, id := range projectIDs {
		cleanID := strings.TrimSpace(id)
		if cleanID == "" {
			continue
		}

		normalized := strings.ToLower(cleanID)
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}

		minutes, err := s.fetchWakaTimeLifetimeMinutesByProjectID(ctx, apiKey, cleanID)
		if err != nil {
			return 0, err
		}

		totalMinutes += minutes
	}

	return totalMinutes, nil
}

func getJSON(ctx context.Context, client *http.Client, requestURL string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
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
		return fmt.Errorf("wakatime api error: %s", strings.TrimSpace(string(body)))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func getGitHubJSON(ctx context.Context, client *http.Client, requestURL string, accessToken string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("github api error: %s", strings.TrimSpace(string(body)))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func parseGitHubRepo(repoURL string) (string, string, error) {
	value := strings.TrimSpace(repoURL)
	if value == "" {
		return "", "", errors.New("github repository url is required")
	}

	if !strings.Contains(value, "://") {
		value = "https://" + value
	}

	parsed, err := url.Parse(value)
	if err != nil {
		return "", "", errors.New("invalid github repository url")
	}

	host := strings.ToLower(strings.TrimSpace(parsed.Hostname()))
	if host != "github.com" && host != "www.github.com" {
		return "", "", errors.New("github repository url must be from github.com")
	}

	parts := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(parts) < 2 {
		return "", "", errors.New("github repository url must include owner and repo")
	}

	owner := strings.TrimSpace(parts[0])
	repo := strings.TrimSpace(parts[1])
	repo = strings.TrimSuffix(repo, ".git")
	if owner == "" || repo == "" {
		return "", "", errors.New("github repository url must include owner and repo")
	}

	return owner, repo, nil
}
