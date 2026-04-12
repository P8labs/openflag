package auth

import (
	"context"
	"strings"
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

func (r *Repository) FindUserByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindUserByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).First(&user, "username = ?", username).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindUserByProvider(ctx context.Context, provider, providerAccountID string) (*models.User, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&account, "provider = ? AND provider_account_id = ?", provider, providerAccountID).
		Error; err != nil {
		return nil, err
	}

	return &account.User, nil
}

func (r *Repository) UpsertUserWithAccount(ctx context.Context, user *models.User, account *models.OAuthAccount) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(user).Error; err != nil {
			return err
		}

		account.UserID = user.ID
		return tx.
			Where(models.OAuthAccount{Provider: account.Provider, ProviderAccountID: account.ProviderAccountID}).
			Assign(models.OAuthAccount{
				UserID:       user.ID,
				AccessToken:  account.AccessToken,
				RefreshToken: account.RefreshToken,
				ExpiresAt:    account.ExpiresAt,
			}).
			FirstOrCreate(account).
			Error
	})
}

func (r *Repository) HasProviderConnection(ctx context.Context, userID, provider string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.OAuthAccount{}).
		Where("user_id = ? AND provider = ?", userID, provider).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) UpsertProviderConnection(ctx context.Context, account *models.OAuthAccount) error {
	return r.db.WithContext(ctx).
		Where(models.OAuthAccount{Provider: account.Provider, ProviderAccountID: account.ProviderAccountID}).
		Assign(models.OAuthAccount{
			UserID:       account.UserID,
			AccessToken:  account.AccessToken,
			RefreshToken: account.RefreshToken,
			ExpiresAt:    account.ExpiresAt,
		}).
		FirstOrCreate(account).
		Error
}

func (r *Repository) FindOAuthAccountByUserAndProvider(ctx context.Context, userID, provider string) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).
		First(&account, "user_id = ? AND provider = ?", userID, provider).
		Error; err != nil {
		return nil, err
	}

	return &account, nil
}

func (r *Repository) CreateSession(ctx context.Context, session *models.Session) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *Repository) FindValidSessionByToken(ctx context.Context, token string) (*models.Session, error) {
	var session models.Session
	now := time.Now()
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("token = ? AND revoked_at IS NULL AND expires_at > ?", token, now).
		First(&session).
		Error
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (r *Repository) RevokeSessionByToken(ctx context.Context, token string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&models.Session{}).
		Where("token = ? AND revoked_at IS NULL", token).
		Update("revoked_at", now).
		Error
}

func (r *Repository) ListUserActivitiesSince(ctx context.Context, userID string, since time.Time) ([]models.UserActivity, error) {
	var days []models.UserActivity
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND activity_date >= ?", userID, since).
		Order("activity_date asc").
		Find(&days).Error
	if err != nil {
		return nil, err
	}

	return days, nil
}

func (r *Repository) ListRecentProjectsByOwner(ctx context.Context, ownerID string, limit int) ([]models.Project, error) {
	var projects []models.Project
	query := r.db.WithContext(ctx).
		Where("owner_id = ?", ownerID).
		Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&projects).Error; err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *Repository) ListRecentPostsByAuthor(ctx context.Context, authorID string, limit int) ([]models.Post, error) {
	var posts []models.Post
	query := r.db.WithContext(ctx).
		Preload("Project").
		Where("author_id = ?", authorID).
		Order("created_at desc")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&posts).Error; err != nil {
		return nil, err
	}

	return posts, nil
}

func (r *Repository) SumTrackedMinutesByUser(ctx context.Context, userID string) (int, error) {
	var total int
	err := r.db.WithContext(ctx).
		Model(&models.Post{}).
		Select("COALESCE(SUM(devlog_minutes), 0)").
		Where("author_id = ?", userID).
		Scan(&total).Error
	if err != nil {
		return 0, err
	}

	return total, nil
}

func (r *Repository) ListNotifications(ctx context.Context, userID string, limit int, offset int) ([]models.Notification, error) {
	var notifications []models.Notification
	query := r.db.WithContext(ctx).
		Preload("Actor").
		Where("user_id = ?", userID).
		Order("created_at desc")

	if limit > 0 {
		query = query.Offset(offset).Limit(limit)
	}

	if err := query.Find(&notifications).Error; err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *Repository) CountUnreadNotifications(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *Repository) MarkAllNotificationsRead(ctx context.Context, userID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", now).Error
}

func (r *Repository) ListExploreProjects(ctx context.Context, query string, mode string, terms []string, limit int, offset int) ([]models.Project, bool, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	db := r.db.WithContext(ctx).
		Model(&models.Project{}).
		Joins("LEFT JOIN users ON users.id = projects.owner_id").
		Preload("Owner")

	switch mode {
	case "trending":
		db = db.Order("COALESCE((SELECT COUNT(1) FROM posts WHERE posts.project_id = projects.id), 0) DESC, projects.updated_at DESC")
	case "recent":
		db = db.Order("projects.updated_at DESC")
	case "skill-match", "interest-match":
		db = db.Order("projects.updated_at DESC")
		db = applyProjectTermFilter(db, terms)
	default:
		db = db.Order("projects.updated_at DESC")
		db = applyProjectQueryFilter(db, query)
	}

	var projects []models.Project
	if err := db.Offset(offset).Limit(limit + 1).Find(&projects).Error; err != nil {
		return nil, false, err
	}

	hasMore := false
	if len(projects) > limit {
		hasMore = true
		projects = projects[:limit]
	}

	return projects, hasMore, nil
}

func (r *Repository) ListExploreUsers(ctx context.Context, query string, mode string, terms []string, limit int, offset int) ([]models.User, bool, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	db := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("users.username <> ''")

	switch mode {
	case "trending":
		db = db.Order("COALESCE((SELECT SUM(count) FROM user_activities WHERE user_activities.user_id = users.id), 0) DESC, users.updated_at DESC")
	case "recent":
		db = db.Order("users.updated_at DESC")
	case "skill-match":
		db = db.Order("users.updated_at DESC")
		db = applyUserTermFilter(db, terms, "skills")
	case "interest-match":
		db = db.Order("users.updated_at DESC")
		db = applyUserTermFilter(db, terms, "interests")
	default:
		db = db.Order("users.updated_at DESC")
		db = applyUserQueryFilter(db, query)
	}

	var users []models.User
	if err := db.Offset(offset).Limit(limit + 1).Find(&users).Error; err != nil {
		return nil, false, err
	}

	hasMore := false
	if len(users) > limit {
		hasMore = true
		users = users[:limit]
	}

	return users, hasMore, nil
}

func applyProjectQueryFilter(db *gorm.DB, query string) *gorm.DB {
	pattern := "%" + strings.ToLower(strings.TrimSpace(query)) + "%"
	if pattern == "%%" {
		return db
	}

	return db.Where(
		"LOWER(projects.title) LIKE ? OR LOWER(projects.summary) LIKE ? OR EXISTS (SELECT 1 FROM unnest(projects.tags) AS tag WHERE LOWER(tag) LIKE ?) OR LOWER(users.name) LIKE ? OR LOWER(users.username) LIKE ?",
		pattern,
		pattern,
		pattern,
		pattern,
		pattern,
	)
}

func applyProjectTermFilter(db *gorm.DB, terms []string) *gorm.DB {
	clauses := make([]string, 0, len(terms))
	args := make([]any, 0, len(terms)*5)

	for _, term := range terms {
		pattern := "%" + strings.ToLower(strings.TrimSpace(term)) + "%"
		if pattern == "%%" {
			continue
		}

		clauses = append(clauses, "(LOWER(projects.title) LIKE ? OR LOWER(projects.summary) LIKE ? OR EXISTS (SELECT 1 FROM unnest(projects.tags) AS tag WHERE LOWER(tag) LIKE ?) OR LOWER(users.name) LIKE ? OR LOWER(users.username) LIKE ?)")
		args = append(args, pattern, pattern, pattern, pattern, pattern)
	}

	if len(clauses) == 0 {
		return db.Where("1 = 0")
	}

	return db.Where(strings.Join(clauses, " OR "), args...)
}

func applyUserQueryFilter(db *gorm.DB, query string) *gorm.DB {
	pattern := "%" + strings.ToLower(strings.TrimSpace(query)) + "%"
	if pattern == "%%" {
		return db
	}

	return db.Where(
		"LOWER(users.name) LIKE ? OR LOWER(users.username) LIKE ? OR LOWER(COALESCE(users.bio, '')) LIKE ? OR EXISTS (SELECT 1 FROM unnest(users.skills) AS skill WHERE LOWER(skill) LIKE ?) OR EXISTS (SELECT 1 FROM unnest(users.interests) AS interest WHERE LOWER(interest) LIKE ?)",
		pattern,
		pattern,
		pattern,
		pattern,
		pattern,
	)
}

func applyUserTermFilter(db *gorm.DB, terms []string, arrayColumn string) *gorm.DB {
	clauses := make([]string, 0, len(terms))
	args := make([]any, 0, len(terms)*3)

	for _, term := range terms {
		pattern := "%" + strings.ToLower(strings.TrimSpace(term)) + "%"
		if pattern == "%%" {
			continue
		}

		clauses = append(clauses, "(LOWER(users.name) LIKE ? OR LOWER(users.username) LIKE ? OR EXISTS (SELECT 1 FROM unnest(users."+arrayColumn+") AS value WHERE LOWER(value) LIKE ?))")
		args = append(args, pattern, pattern, pattern)
	}

	if len(clauses) == 0 {
		return db.Where("1 = 0")
	}

	return db.Where(strings.Join(clauses, " OR "), args...)
}
