package comments

import (
	"context"

	"openflag/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListByPostID(ctx context.Context, postID string) ([]models.PostComment, error) {
	var comments []models.PostComment
	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("post_id = ?", postID).
		Order("created_at desc").
		Find(&comments).Error; err != nil {
		return nil, err
	}

	return comments, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*models.PostComment, error) {
	var comment models.PostComment
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&comment, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &comment, nil
}

func (r *Repository) Create(ctx context.Context, comment *models.PostComment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}

func (r *Repository) Update(ctx context.Context, id string, updates map[string]any) (*models.PostComment, error) {
	if err := r.db.WithContext(ctx).Model(&models.PostComment{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}

	return r.FindByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.PostComment{}, "id = ?", id).Error
}
