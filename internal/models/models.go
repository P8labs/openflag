package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type User struct {
	ID                string         `gorm:"primaryKey;size:36" json:"id"`
	Name              string         `gorm:"not null" json:"name"`
	Username          string         `gorm:"uniqueIndex;not null" json:"username" default:""`
	UsernameChangedAt *time.Time     `gorm:"index" json:"usernameChangedAt,omitempty"`
	Email             string         `gorm:"uniqueIndex;not null" json:"email"`
	Image             *string        `json:"image,omitempty"`
	Bio               *string        `gorm:"type:text" json:"bio,omitempty"`
	OnboardState      int            `gorm:"default:0" json:"onboardState"`
	Skills            pq.StringArray `gorm:"type:text[];default:'{}'" json:"skills"`
	Interests         pq.StringArray `gorm:"type:text[];default:'{}'" json:"interests"`
	Availability      *string        `json:"availability,omitempty"`
	LookingFor        *string        `json:"lookingFor,omitempty"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`

	Accounts []OAuthAccount `gorm:"foreignKey:UserID;references:ID" json:"accounts,omitempty"`
	Sessions []Session      `gorm:"foreignKey:UserID;references:ID" json:"sessions,omitempty"`
	Projects []Project      `gorm:"foreignKey:OwnerID;references:ID" json:"projects,omitempty"`
	Posts    []Post         `gorm:"foreignKey:AuthorID;references:ID" json:"posts,omitempty"`
	Comments []PostComment  `gorm:"foreignKey:UserID;references:ID" json:"comments,omitempty"`
	Activity []UserActivity `gorm:"foreignKey:UserID;references:ID" json:"activity,omitempty"`

	LikedPosts []Post `gorm:"many2many:post_likes;constraint:OnDelete:CASCADE;" json:"likedPosts,omitempty"`

	ContributedProjects []Project      `gorm:"many2many:project_collaborators;constraint:OnDelete:CASCADE;" json:"contributedProjects,omitempty"`
	Notifications       []Notification `gorm:"foreignKey:UserID;references:ID" json:"notifications,omitempty"`
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

	User User `gorm:"constraint:OnDelete:CASCADE;" json:"user"`
}

func (a *OAuthAccount) BeforeCreate(_ *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}

	return nil
}

type Project struct {
	ID            string         `gorm:"primaryKey;size:36" json:"id"`
	OwnerID       string         `gorm:"index;not null" json:"ownerId"`
	Title         string         `gorm:"not null" json:"title"`
	Status        string         `gorm:"type:text;not null;default:'dev'" json:"status"`
	Summary       string         `gorm:"type:text;not null" json:"summary"`
	Description   string         `gorm:"type:text;not null" json:"description"`
	LogoURL       *string        `json:"logoUrl"`
	Url           *string        `json:"url,omitempty"`
	Image         *string        `json:"image,omitempty"`
	Video         *string        `json:"video,omitempty"`
	GitHubURL     *string        `gorm:"column:github_url" json:"githubUrl"`
	WakatimeIDs   pq.StringArray `gorm:"type:text[];default:'{}'" json:"wakatimeIds"`
	Tags          pq.StringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	GitHubStarred bool           `gorm:"-" json:"githubStarred,omitempty"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`

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
	ID            string         `gorm:"primaryKey;size:36" json:"id"`
	AuthorID      string         `gorm:"index;not null" json:"authorId"`
	Content       string         `gorm:"type:text" json:"content"`
	Category      string         `gorm:"type:text;not null;default:'devlog'" json:"category"`
	DevlogMinutes *int           `json:"devlogMinutes,omitempty"`
	Quiz          *string        `gorm:"type:text" json:"quiz,omitempty"`
	QuizVotes     []PostQuizVote `gorm:"foreignKey:PostID;references:ID" json:"quizVotes,omitempty"`
	MyQuizVote    *PostQuizVote  `gorm:"-" json:"myQuizVote,omitempty"`
	Image         *string        `json:"image,omitempty"`
	GitHubURL     *string        `json:"githubUrl"`
	RefURLs       pq.StringArray `gorm:"type:text[];default:'{}'" json:"refUrls"`
	WakatimeIDs   pq.StringArray `gorm:"type:text[];default:'{}'" json:"wakatimeIds"`
	ProjectID     *string        `gorm:"index" json:"projectId,omitempty"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`

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

type PostQuizVote struct {
	ID          string    `gorm:"primaryKey;size:36" json:"id"`
	PostID      string    `gorm:"index:idx_post_quiz_vote,unique;not null" json:"postId"`
	UserID      string    `gorm:"index:idx_post_quiz_vote,unique;not null" json:"userId"`
	OptionIndex int       `gorm:"not null" json:"optionIndex"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	Post Post `gorm:"foreignKey:PostID;references:ID;constraint:OnDelete:CASCADE;" json:"post,omitempty"`
	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE;" json:"user,omitempty"`
}

func (v *PostQuizVote) BeforeCreate(_ *gorm.DB) error {
	if v.ID == "" {
		v.ID = uuid.NewString()
	}

	return nil
}

type UserActivity struct {
	ID           string    `gorm:"primaryKey;size:36" json:"id"`
	UserID       string    `gorm:"index:idx_user_activity_date,unique;not null" json:"userId"`
	ActivityDate time.Time `gorm:"type:date;index:idx_user_activity_date,unique;not null" json:"activityDate"`
	Count        int       `gorm:"not null;default:0" json:"count"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`

	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE;" json:"user"`
}

func (a *UserActivity) BeforeCreate(_ *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}

	return nil
}

type Notification struct {
	ID         string     `gorm:"primaryKey;size:36" json:"id"`
	UserID     string     `gorm:"index;not null" json:"userId"`
	ActorID    *string    `gorm:"index" json:"actorId,omitempty"`
	Type       string     `gorm:"type:text;not null" json:"type"`
	Message    string     `gorm:"type:text;not null" json:"message"`
	EntityType string     `gorm:"type:text;not null" json:"entityType"`
	EntityID   string     `gorm:"index;not null" json:"entityId"`
	ReadAt     *time.Time `gorm:"index" json:"readAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`

	User  User  `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE;" json:"user,omitempty"`
	Actor *User `gorm:"foreignKey:ActorID;references:ID;constraint:OnDelete:SET NULL;" json:"actor,omitempty"`
}

func (n *Notification) BeforeCreate(_ *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.NewString()
	}

	return nil
}
