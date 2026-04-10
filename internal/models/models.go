package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type User struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Accounts []OAuthAccount `gorm:"foreignKey:UserID;references:ID" json:"accounts,omitempty"`
	Projects []Project      `gorm:"foreignKey:OwnerID;references:ID" json:"projects,omitempty"`
	Posts    []Post         `gorm:"foreignKey:AuthorID;references:ID" json:"posts,omitempty"`
	Comments []PostComment  `gorm:"foreignKey:UserID;references:ID" json:"comments,omitempty"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}

	return nil
}

type OAuthAccount struct {
	ID                string     `gorm:"primaryKey;size:36" json:"id"`
	UserID            string     `gorm:"index;not null" json:"userId"`
	Provider          string     `gorm:"index:idx_provider_account,unique;not null" json:"provider"`
	ProviderAccountID string     `gorm:"index:idx_provider_account,unique;not null" json:"providerAccountId"`
	AccessToken       string     `json:"-"`
	RefreshToken      string     `json:"-"`
	ExpiresAt         *time.Time `json:"expiresAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`

	User User `gorm:"constraint:OnDelete:CASCADE;" json:"user,omitempty"`
}

func (a *OAuthAccount) BeforeCreate(_ *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}

	return nil
}

type Project struct {
	ID          string         `gorm:"primaryKey;size:36" json:"id"`
	OwnerID     string         `gorm:"index;not null" json:"ownerId"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `gorm:"type:text;not null" json:"description"`
	GitHubURL   string         `json:"githubUrl"`
	WakatimeID  string         `json:"wakatimeId"`
	Tags        pq.StringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`

	Owner User   `gorm:"foreignKey:OwnerID;references:ID;constraint:OnDelete:CASCADE;" json:"owner,omitempty"`
	Posts []Post `json:"posts,omitempty"`
}

func (p *Project) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}

	return nil
}

type Post struct {
	ID         string    `gorm:"primaryKey;size:36" json:"id"`
	AuthorID   string    `gorm:"index;not null" json:"authorId"`
	Content    string    `gorm:"type:text" json:"content"`
	Image      string    `json:"image"`
	GitHubURL  string    `json:"githubUrl"`
	PRURL      string    `json:"prUrl"`
	IssueURL   string    `json:"issueUrl"`
	WakatimeID string    `json:"wakatimeId"`
	ProjectID  *string   `gorm:"index" json:"projectId,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	Author   User          `gorm:"foreignKey:AuthorID;references:ID;constraint:OnDelete:CASCADE;" json:"author,omitempty"`
	Project  *Project      `gorm:"constraint:OnDelete:SET NULL;" json:"project,omitempty"`
	Comments []PostComment `json:"comments,omitempty"`
}

func (p *Post) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}

	return nil
}

type PostComment struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	PostID    string    `gorm:"index;not null" json:"postId"`
	UserID    string    `gorm:"index;not null" json:"userId"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Post Post `gorm:"foreignKey:PostID;references:ID;constraint:OnDelete:CASCADE;" json:"post,omitempty"`
	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE;" json:"user,omitempty"`
}

func (c *PostComment) BeforeCreate(_ *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.NewString()
	}

	return nil
}
