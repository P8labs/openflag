package projects

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

func (r *Repository) List(ctx context.Context) ([]models.Project, error) {
	var projects []models.Project
	if err := r.db.WithContext(ctx).
		Preload("Owner").
		Order("created_at desc").
		Find(&projects).Error; err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*models.Project, error) {
	var project models.Project
	if err := r.db.WithContext(ctx).
		Preload("Owner").
		Preload("Posts").
		First(&project, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *Repository) Create(ctx context.Context, project *models.Project) error {
	return r.db.WithContext(ctx).Create(project).Error
}

func (r *Repository) Update(ctx context.Context, id string, updates map[string]any) (*models.Project, error) {
	if err := r.db.WithContext(ctx).Model(&models.Project{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}

	return r.FindByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&models.Project{}, "id = ?", id).Error
}
