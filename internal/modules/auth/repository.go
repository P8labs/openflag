package auth

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
