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
		Preload("Likes").
		Preload("Comments").
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
		Preload("Likes").
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

func (r *Repository) SumLoggedDevlogMinutesByProject(ctx context.Context, projectID string) (int, error) {
	var total int
	err := r.db.WithContext(ctx).
		Model(&models.Post{}).
		Select("COALESCE(SUM(devlog_minutes), 0)").
		Where("project_id = ? AND category = ?", projectID, "devlog").
		Scan(&total).
		Error
	if err != nil {
		return 0, err
	}

	return total, nil
}

func (r *Repository) HasUserLiked(ctx context.Context, postID, userID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table("post_likes").
		Where("post_id = ? AND user_id = ?", postID, userID).
		Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) AddLike(ctx context.Context, postID, userID string) error {
	post := &models.Post{ID: postID}
	user := &models.User{ID: userID}
	return r.db.WithContext(ctx).Model(post).Association("Likes").Append(user)
}

func (r *Repository) RemoveLike(ctx context.Context, postID, userID string) error {
	post := &models.Post{ID: postID}
	user := &models.User{ID: userID}
	return r.db.WithContext(ctx).Model(post).Association("Likes").Delete(user)
}
