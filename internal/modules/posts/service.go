package posts

import (
	"context"
	"errors"
	"strings"

	"openflag/internal/models"
	projectsmodule "openflag/internal/modules/projects"

	"gorm.io/gorm"
)

var (
	ErrPostNotFound  = errors.New("post not found")
	ErrPostForbidden = errors.New("forbidden")
)

type Service struct {
	repo        *Repository
	projectRepo projectLookup
	db          *gorm.DB
}

type projectLookup interface {
	FindByID(context.Context, string) (*models.Project, error)
}

func NewService(repo *Repository, projectRepo projectLookup, db *gorm.DB) *Service {
	return &Service{repo: repo, projectRepo: projectRepo, db: db}
}

func (s *Service) List(ctx context.Context) ([]models.Post, error) {
	return s.repo.List(ctx)
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

	projectID := strings.TrimSpace(input.ProjectID)
	if projectID != "" {
		project, err := s.projectRepo.FindByID(ctx, projectID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, projectsmodule.ErrProjectNotFound
			}
			return nil, err
		}
		if project.OwnerID != authorID {
			return nil, ErrPostForbidden
		}
	}

	post := &models.Post{
		AuthorID:    authorID,
		Content:     content,
		Image:       input.Image,
		GitHubURL:   input.GitHubURL,
		PRURL:       input.PRURL,
		IssueURL:    input.IssueURL,
		WakatimeIDs: input.WakatimeIDs,
		ProjectID:   nil,
	}
	if projectID != "" {
		post.ProjectID = &projectID
	}

	if err := s.repo.Create(ctx, post); err != nil {
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
	if input.Image != nil {
		updates["image"] = strings.TrimSpace(*input.Image)
	}
	if input.GitHubURL != nil {
		updates["github_url"] = strings.TrimSpace(*input.GitHubURL)
	}
	if input.PRURL != nil {
		updates["pr_url"] = strings.TrimSpace(*input.PRURL)
	}
	if input.IssueURL != nil {
		updates["issue_url"] = strings.TrimSpace(*input.IssueURL)
	}
	if input.WakatimeIDs != nil {
		updates["wakatime_ids"] = input.WakatimeIDs
	}
	if input.ProjectID != nil {
		projectID := strings.TrimSpace(*input.ProjectID)
		if projectID == "" {
			updates["project_id"] = nil
		} else {
			linked, err := s.projectRepo.FindByID(ctx, projectID)
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

func mapPostErr(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrPostNotFound
	}

	return err
}
