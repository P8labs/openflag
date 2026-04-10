package projects

import (
	"context"
	"errors"
	"strings"

	"openflag/internal/models"

	"gorm.io/gorm"
)

var (
	ErrProjectNotFound  = errors.New("project not found")
	ErrProjectForbidden = errors.New("forbidden")
)

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
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
	if title == "" || description == "" {
		return nil, errors.New("title and description are required")
	}

	project := &models.Project{
		OwnerID:     ownerID,
		Title:       title,
		Description: description,
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
	if input.Title != nil {
		value := strings.TrimSpace(*input.Title)
		if value != "" {
			updates["title"] = value
		}
	}
	if input.Description != nil {
		value := strings.TrimSpace(*input.Description)
		if value != "" {
			updates["description"] = value
		}
	}
	if input.GitHubURL != nil {
		updates["github_url"] = strings.TrimSpace(*input.GitHubURL)
	}
	if input.WakatimeID != nil {
		updates["wakatime_id"] = strings.TrimSpace(*input.WakatimeID)
	}
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
