package projects

import (
	"context"
	"strings"

	"openflag/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, searchQuery string, limit int, offset int) ([]models.Project, bool, error) {
	var projects []models.Project
	query := r.db.WithContext(ctx).
		Preload("Owner").
		Order("created_at desc")

	normalizedQuery := strings.TrimSpace(strings.ToLower(searchQuery))
	if normalizedQuery != "" {
		like := "%" + normalizedQuery + "%"
		query = query.Where(
			"LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(COALESCE(array_to_string(tags, ' '), '')) LIKE ?",
			like,
			like,
			like,
		)
	}

	hasMore := false
	if limit > 0 {
		query = query.Offset(offset).Limit(limit + 1)
	}

	if err := query.Find(&projects).Error; err != nil {
		return nil, false, err
	}

	if limit > 0 && len(projects) > limit {
		hasMore = true
		projects = projects[:limit]
	}

	return projects, hasMore, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*models.Project, error) {
	var project models.Project
	if err := r.db.WithContext(ctx).
		Preload("Owner").
		Preload("Collaborators").
		Preload("Posts").
		Preload("Posts.Author").
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
