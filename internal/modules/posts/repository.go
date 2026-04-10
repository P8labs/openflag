package posts

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

func (r *Repository) List(ctx context.Context) ([]models.Post, error) {
	var posts []models.Post
	if err := r.db.WithContext(ctx).
		Preload("Author").
		Preload("Project").
		Order("created_at desc").
		Find(&posts).Error; err != nil {
		return nil, err
	}

	return posts, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*models.Post, error) {
	var post models.Post
	if err := r.db.WithContext(ctx).
		Preload("Author").
		Preload("Project").
		Preload("Comments").
		First(&post, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &post, nil
}

func (r *Repository) Create(ctx context.Context, post *models.Post) error {
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *Repository) Update(ctx context.Context, id string, updates map[string]any) (*models.Post, error) {
	if err := r.db.WithContext(ctx).Model(&models.Post{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}

	return r.FindByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Post{}, "id = ?", id).Error
}
