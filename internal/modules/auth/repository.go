package auth

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
