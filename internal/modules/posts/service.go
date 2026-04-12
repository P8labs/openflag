package posts

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"openflag/internal/models"
	projectsmodule "openflag/internal/modules/projects"

	"gorm.io/gorm"
)

var (
	ErrPostNotFound        = errors.New("post not found")
	ErrPostForbidden       = errors.New("forbidden")
	ErrPostInvalidCategory = errors.New("invalid post category")
)

const (
	PostCategoryDevlog  = "devlog"
	PostCategoryThought = "thought"
	PostCategoryShow    = "show"
	PostCategoryEvent   = "event"
	PostCategoryAsk     = "ask"
)

type Service struct {
	repo          *Repository
	projectAccess projectLookup
	db            *gorm.DB
}

type projectLookup interface {
	Get(context.Context, string) (*models.Project, error)
	TrackedMinutes(context.Context, string, string) (*projectsmodule.TrackedTimeResponse, error)
}

func NewService(repo *Repository, projectAccess projectLookup, db *gorm.DB) *Service {
	return &Service{repo: repo, projectAccess: projectAccess, db: db}
}

func (s *Service) List(ctx context.Context, userID string, limit int, offset int) ([]models.Post, bool, error) {
	posts, hasMore, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		return nil, false, err
	}

	if userID == "" {
		return posts, hasMore, nil
	}

	for index := range posts {
		vote, voteErr := s.repo.FindQuizVoteByUser(ctx, posts[index].ID, userID)
		if voteErr == nil {
			posts[index].MyQuizVote = vote
		}
	}

	return posts, hasMore, nil
}

func (s *Service) Get(ctx context.Context, id string) (*models.Post, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, mapPostErr(err)
	}

	return post, nil
}

func (s *Service) Create(ctx context.Context, authorID string, input CreateRequest) (*models.Post, error) {
	content := strings.TrimSpace(input.Content)
	if content == "" {
		return nil, errors.New("content is required")
	}
	if len(content) > 5000 {
		return nil, errors.New("content is too long")
	}

	category, err := normalizePostCategory(input.Category)
	if err != nil {
		return nil, err
	}

	projectID := strings.TrimSpace(input.ProjectID)
	devlogMinutes := (*int)(nil)
	if projectID != "" {
		project, err := s.projectAccess.Get(ctx, projectID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, projectsmodule.ErrProjectNotFound
			}
			return nil, err
		}
		if project.OwnerID != authorID {
			return nil, ErrPostForbidden
		}

		if category == PostCategoryDevlog {
			trackedTime, err := s.projectAccess.TrackedMinutes(ctx, projectID, authorID)
			if err != nil {
				return nil, err
			}

			alreadyLoggedMinutes, err := s.repo.SumLoggedDevlogMinutesByProject(ctx, projectID)
			if err != nil {
				return nil, err
			}

			remainingMinutes := trackedTime.TotalMinutes - alreadyLoggedMinutes
			if remainingMinutes < 0 {
				remainingMinutes = 0
			}
			devlogMinutes = &remainingMinutes
		}
	}

	post := &models.Post{
		AuthorID:      authorID,
		Content:       content,
		Category:      category,
		DevlogMinutes: devlogMinutes,
		Quiz:          normalizedOptionalStringPtr(input.Quiz),
		Image:         input.Image,
		GitHubURL:     input.GitHubURL,
		RefURLs:       normalizeRefURLs(input.RefURLs),
		WakatimeIDs:   input.WakatimeIDs,
		ProjectID:     nil,
	}
	if projectID != "" {
		post.ProjectID = &projectID
	}

	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}

	if err := s.repo.IncrementUserActivity(ctx, authorID, time.Now()); err != nil {
		return nil, err
	}

	return s.repo.FindByID(ctx, post.ID)
}

func (s *Service) Update(ctx context.Context, id string, authorID string, input UpdateRequest) (*models.Post, error) {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, mapPostErr(err)
	}
	if post.AuthorID != authorID {
		return nil, ErrPostForbidden
	}

	updates := map[string]any{}
	if input.Content != nil {
		content := strings.TrimSpace(*input.Content)
		if content != "" {
			updates["content"] = content
		}
	}
	if input.Category != nil {
		category, err := normalizePostCategory(*input.Category)
		if err != nil {
			return nil, err
		}
		updates["category"] = category
	}
	if input.Quiz != nil {
		updates["quiz"] = normalizedOptionalStringPtr(input.Quiz)
	}
	if input.Image != nil {
		updates["image"] = strings.TrimSpace(*input.Image)
	}
	if input.GitHubURL != nil {
		updates["github_url"] = strings.TrimSpace(*input.GitHubURL)
	}
	if input.RefURLs != nil {
		updates["ref_urls"] = normalizeRefURLs(input.RefURLs)
	}
	if input.WakatimeIDs != nil {
		updates["wakatime_ids"] = input.WakatimeIDs
	}
	if input.ProjectID != nil {
		projectID := strings.TrimSpace(*input.ProjectID)
		if projectID == "" {
			updates["project_id"] = nil
			updates["devlog_minutes"] = nil
		} else {
			linked, err := s.projectAccess.Get(ctx, projectID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, projectsmodule.ErrProjectNotFound
				}
				return nil, err
			}
			if linked.OwnerID != authorID {
				return nil, ErrPostForbidden
			}
			updates["project_id"] = projectID
		}
	}

	if len(updates) == 0 {
		return post, nil
	}

	updated, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *Service) Delete(ctx context.Context, id string, authorID string) error {
	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return mapPostErr(err)
	}
	if post.AuthorID != authorID {
		return ErrPostForbidden
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) ToggleLike(ctx context.Context, id string, userID string) (*models.Post, bool, error) {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return nil, false, mapPostErr(err)
	}

	hasLiked, err := s.repo.HasUserLiked(ctx, id, userID)
	if err != nil {
		return nil, false, err
	}

	liked := false
	if hasLiked {
		if err := s.repo.RemoveLike(ctx, id, userID); err != nil {
			return nil, false, err
		}
	} else {
		if err := s.repo.AddLike(ctx, id, userID); err != nil {
			return nil, false, err
		}
		liked = true
		if postOwner, findErr := s.repo.FindByID(ctx, id); findErr == nil {
			if postOwner.AuthorID != userID {
				_ = s.db.WithContext(ctx).Create(&models.Notification{
					UserID:     postOwner.AuthorID,
					ActorID:    userID,
					Type:       "post_liked",
					Message:    "liked your post",
					EntityType: "post",
					EntityID:   id,
				}).Error
			}
		}
	}

	post, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, false, mapPostErr(err)
	}

	return post, liked, nil
}

func (s *Service) VoteQuiz(ctx context.Context, postID string, userID string, optionIndex int) (*models.Post, error) {
	post, err := s.repo.FindByID(ctx, postID)
	if err != nil {
		return nil, mapPostErr(err)
	}

	if post.Quiz == nil || strings.TrimSpace(*post.Quiz) == "" {
		return nil, errors.New("quiz not available")
	}

	if _, err := s.repo.FindQuizVoteByUser(ctx, postID, userID); err == nil {
		return nil, errors.New("you have already voted")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if optionIndex < 0 {
		return nil, errors.New("invalid option")
	}

	var quizPayload struct {
		Type    string   `json:"type"`
		Options []string `json:"options"`
	}
	if err := json.Unmarshal([]byte(*post.Quiz), &quizPayload); err != nil {
		return nil, errors.New("invalid quiz payload")
	}
	if quizPayload.Type != "mcq" {
		return nil, errors.New("quiz is not an mcq")
	}
	if optionIndex >= len(quizPayload.Options) {
		return nil, errors.New("invalid option")
	}

	if err := s.repo.CreateQuizVote(ctx, &models.PostQuizVote{PostID: postID, UserID: userID, OptionIndex: optionIndex}); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, errors.New("you have already voted")
		}
		return nil, err
	}

	return s.repo.FindByID(ctx, postID)
}

func mapPostErr(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrPostNotFound
	}

	return err
}

func normalizePostCategory(value string) (string, error) {
	category := strings.ToLower(strings.TrimSpace(value))
	if category == "" {
		return PostCategoryDevlog, nil
	}

	switch category {
	case PostCategoryDevlog, PostCategoryThought, PostCategoryShow, PostCategoryEvent, PostCategoryAsk:
		return category, nil
	default:
		return "", ErrPostInvalidCategory
	}
}

func normalizedOptionalStringPtr(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func normalizeRefURLs(input []string) []string {
	if len(input) == 0 {
		return []string{}
	}

	normalized := make([]string, 0, len(input))
	seen := map[string]struct{}{}
	for _, raw := range input {
		item := strings.TrimSpace(raw)
		if item == "" {
			continue
		}

		parts := strings.SplitN(item, ":", 2)
		if len(parts) != 2 {
			continue
		}

		refType := strings.ToLower(strings.TrimSpace(parts[0]))
		refURL := strings.TrimSpace(parts[1])
		if refType == "" || refURL == "" {
			continue
		}

		composed := refType + ":" + refURL
		if _, exists := seen[composed]; exists {
			continue
		}
		seen[composed] = struct{}{}
		normalized = append(normalized, composed)
	}

	return normalized
}
