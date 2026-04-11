package posts

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

func (r *Repository) List(ctx context.Context, limit int, offset int) ([]models.Post, bool, error) {
	var posts []models.Post
	query := r.db.WithContext(ctx).
		Preload("Author").
		Preload("Project").
		Preload("Likes").
		Preload("QuizVotes").
		Preload("Comments").
		Order("created_at desc")

	hasMore := false
	if limit > 0 {
		query = query.Offset(offset).Limit(limit + 1)
	}

	if err := query.Find(&posts).Error; err != nil {
		return nil, false, err
	}

	if limit > 0 && len(posts) > limit {
		hasMore = true
		posts = posts[:limit]
	}

	return posts, hasMore, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*models.Post, error) {
	var post models.Post
	if err := r.db.WithContext(ctx).
		Preload("Author").
		Preload("Project").
		Preload("Likes").
		Preload("QuizVotes").
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

func (r *Repository) IncrementUserActivity(ctx context.Context, userID string, day time.Time) error {
	activityDate := day.UTC().Truncate(24 * time.Hour)
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var activity models.UserActivity
		err := tx.Where("user_id = ? AND activity_date = ?", userID, activityDate).First(&activity).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				return tx.Create(&models.UserActivity{
					UserID:       userID,
					ActivityDate: activityDate,
					Count:        1,
				}).Error
			}
			return err
		}

		return tx.Model(&models.UserActivity{}).
			Where("id = ?", activity.ID).
			Update("count", gorm.Expr("count + 1")).Error
	})
}

func (r *Repository) FindQuizVoteByUser(ctx context.Context, postID, userID string) (*models.PostQuizVote, error) {
	var vote models.PostQuizVote
	if err := r.db.WithContext(ctx).
		First(&vote, "post_id = ? AND user_id = ?", postID, userID).Error; err != nil {
		return nil, err
	}

	return &vote, nil
}

func (r *Repository) CreateQuizVote(ctx context.Context, vote *models.PostQuizVote) error {
	return r.db.WithContext(ctx).Create(vote).Error
}
