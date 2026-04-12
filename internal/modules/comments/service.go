package comments

import (
	"context"
	"errors"
	"strings"

	"openflag/internal/models"

	"gorm.io/gorm"
)

var (
	ErrCommentNotFound  = errors.New("comment not found")
	ErrCommentForbidden = errors.New("forbidden")
)

type postLookup interface {
	FindByID(context.Context, string) (*models.Post, error)
}

type Service struct {
	repo     *Repository
	postRepo postLookup
	db       *gorm.DB
}

func NewService(repo *Repository, postRepo postLookup, db *gorm.DB) *Service {
	return &Service{repo: repo, postRepo: postRepo, db: db}
}

func (s *Service) List(ctx context.Context, postID string) ([]models.PostComment, error) {
	if _, err := s.postRepo.FindByID(ctx, postID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}

	return s.repo.ListByPostID(ctx, postID)
}

func (s *Service) Create(ctx context.Context, postID, userID string, input CreateRequest) (*models.PostComment, error) {
	content := strings.TrimSpace(input.Content)
	if content == "" {
		return nil, errors.New("content is required")
	}

	post, err := s.postRepo.FindByID(ctx, postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCommentNotFound
		}
		return nil, err
	}

	comment := &models.PostComment{
		PostID:  postID,
		UserID:  userID,
		Content: content,
	}

	if err := s.repo.Create(ctx, comment); err != nil {
		return nil, err
	}

	if post.AuthorID != userID {
		_ = s.db.WithContext(ctx).Create(&models.Notification{
			UserID:     post.AuthorID,
			ActorID:    userID,
			Type:       "post_commented",
			Message:    "commented on your post",
			EntityType: "post",
			EntityID:   postID,
		}).Error
	}

	return s.repo.FindByID(ctx, comment.ID)
}

func (s *Service) Update(ctx context.Context, id, userID string, input UpdateRequest) (*models.PostComment, error) {
	comment, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, mapCommentErr(err)
	}
	if comment.UserID != userID {
		return nil, ErrCommentForbidden
	}

	updates := map[string]any{}
	if input.Content != nil {
		content := strings.TrimSpace(*input.Content)
		if content != "" {
			updates["content"] = content
		}
	}

	if len(updates) == 0 {
		return comment, nil
	}

	updated, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	comment, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return mapCommentErr(err)
	}
	if comment.UserID != userID {
		return ErrCommentForbidden
	}

	return s.repo.Delete(ctx, id)
}

func mapCommentErr(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrCommentNotFound
	}

	return err
}
