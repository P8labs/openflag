package media

import (
	"context"
	"time"

	"openflag/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, upload *models.ImageUpload) error {
	return r.db.WithContext(ctx).Create(upload).Error
}

func (r *Repository) ActivateByURL(ctx context.Context, userID string, secureURL string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.ImageUpload{}).
		Where("user_id = ? AND secure_url = ?", userID, secureURL).
		Updates(map[string]any{
			"is_active":    true,
			"activated_at": &now,
			"last_seen_at": &now,
		}).
		Error
}

func (r *Repository) FindByURL(ctx context.Context, userID string, secureURL string) (*models.ImageUpload, error) {
	var upload models.ImageUpload
	if err := r.db.WithContext(ctx).First(&upload, "user_id = ? AND secure_url = ?", userID, secureURL).Error; err != nil {
		return nil, err
	}

	return &upload, nil
}
