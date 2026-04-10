package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type User struct {
	ID           string         `gorm:"primaryKey;size:36" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username" default:""`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Image        *string        `json:"image,omitempty"`
	Bio          *string        `gorm:"type:text" json:"bio,omitempty"`
	OnboardState int            `gorm:"default:0" json:"onboardState"`
	Skills       pq.StringArray `gorm:"type:text[];default:'{}'" json:"skills"`
	Interests    pq.StringArray `gorm:"type:text[];default:'{}'" json:"interests"`
	Availability *string        `json:"availability,omitempty"`
	LookingFor   *string        `json:"lookingFor,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`

	Accounts []OAuthAccount `gorm:"foreignKey:UserID;references:ID" json:"accounts,omitempty"`
	Sessions []Session      `gorm:"foreignKey:UserID;references:ID" json:"sessions,omitempty"`
	Projects []Project      `gorm:"foreignKey:OwnerID;references:ID" json:"projects,omitempty"`
	Posts    []Post         `gorm:"foreignKey:AuthorID;references:ID" json:"posts,omitempty"`
	Comments []PostComment  `gorm:"foreignKey:UserID;references:ID" json:"comments,omitempty"`

	LikedPosts []Post `gorm:"many2many:post_likes;constraint:OnDelete:CASCADE;" json:"likedPosts,omitempty"`

	ContributedProjects []Project `gorm:"many2many:project_collaborators;constraint:OnDelete:CASCADE;" json:"contributedProjects,omitempty"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}

	return nil
}

type Session struct {
	ID        string     `gorm:"primaryKey;size:36" json:"id"`
	UserID    string     `gorm:"index;not null" json:"userId"`
	Token     string     `gorm:"uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"index;not null" json:"expiresAt"`
	RevokedAt *time.Time `gorm:"index" json:"revokedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`

	User User `gorm:"constraint:OnDelete:CASCADE;" json:"user"`
}

func (s *Session) BeforeCreate(_ *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.NewString()
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
	Url         *string        `json:"url,omitempty"`
	Image       *string        `json:"image,omitempty"`
	Video       *string        `json:"video,omitempty"`
	GitHubURL   *string        `json:"githubUrl"`
	WakatimeIDs pq.StringArray `gorm:"type:text[];default:'{}'" json:"wakatimeIds"`
	Tags        pq.StringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`

	Collaborators []User `gorm:"many2many:project_collaborators;constraint:OnDelete:CASCADE;" json:"collaborators,omitempty"`

	Owner User   `gorm:"foreignKey:OwnerID;references:ID;constraint:OnDelete:CASCADE;" json:"owner"`
	Posts []Post `json:"posts,omitempty"`
}

func (p *Project) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}

	return nil
}

type Post struct {
	ID          string         `gorm:"primaryKey;size:36" json:"id"`
	AuthorID    string         `gorm:"index;not null" json:"authorId"`
	Content     string         `gorm:"type:text" json:"content"`
	Image       *string        `json:"image,omitempty"`
	GitHubURL   *string        `json:"githubUrl"`
	PRURL       *string        `json:"prUrl"`
	IssueURL    *string        `json:"issueUrl"`
	WakatimeIDs pq.StringArray `gorm:"type:text[];default:'{}'" json:"wakatimeIds"`
	ProjectID   *string        `gorm:"index" json:"projectId,omitempty"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`

	Likes []User `gorm:"many2many:post_likes;constraint:OnDelete:CASCADE;" json:"likes,omitempty"`

	Author   User          `gorm:"foreignKey:AuthorID;references:ID;constraint:OnDelete:CASCADE;" json:"author"`
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
