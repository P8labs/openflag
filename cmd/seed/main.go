package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"openflag/internal/config"
	"openflag/internal/database"
	"openflag/internal/models"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

const (
	seedUsers    = 20
	seedProjects = 40
	seedPosts    = 100
)

type activityKey struct {
	userID string
	date   string
}

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	if err := seed(db, seedUsers, seedProjects, seedPosts); err != nil {
		log.Fatalf("seed failed: %v", err)
	}

	log.Printf("seed complete: users=%d projects=%d posts=%d", seedUsers, seedProjects, seedPosts)
}

func seed(db *gorm.DB, userCount int, projectCount int, postCount int) error {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	suffix := time.Now().UnixNano() % 1000000
	now := time.Now().UTC()

	skillsPool := []string{"Go", "TypeScript", "React", "DevOps", "AI", "Design", "Backend", "Mobile"}
	interestsPool := []string{"Open Source", "SaaS", "Developer Tools", "Fintech", "EdTech", "HealthTech", "Web3", "Climate"}
	statuses := []string{"dev", "prototype", "live"}
	categories := []string{"devlog", "update", "question"}

	users := make([]models.User, 0, userCount)
	for i := 0; i < userCount; i++ {
		bio := fmt.Sprintf("Seed user %d building tools and sharing progress.", i+1)
		availability := []string{"Weeknights", "Weekends", "Flexible"}[i%3]
		lookingFor := []string{"Co-founders", "Contributors", "Design partners"}[i%3]

		users = append(users, models.User{
			Name:         fmt.Sprintf("Seed User %02d", i+1),
			Username:     fmt.Sprintf("seed_user_%02d_%d", i+1, suffix),
			Email:        fmt.Sprintf("seed_user_%02d_%d@openflag.dev", i+1, suffix),
			Bio:          strPtr(bio),
			OnboardState: 3,
			Skills: pq.StringArray{
				skillsPool[i%len(skillsPool)],
				skillsPool[(i+3)%len(skillsPool)],
			},
			Interests: pq.StringArray{
				interestsPool[i%len(interestsPool)],
				interestsPool[(i+2)%len(interestsPool)],
			},
			Availability: strPtr(availability),
			LookingFor:   strPtr(lookingFor),
		})
	}

	if err := db.CreateInBatches(&users, 50).Error; err != nil {
		return fmt.Errorf("create users: %w", err)
	}

	projects := make([]models.Project, 0, projectCount)
	for i := 0; i < projectCount; i++ {
		owner := users[i%len(users)]
		updatedAt := now.Add(-time.Duration(rng.Intn(28*24)) * time.Hour)
		createdAt := updatedAt.Add(-time.Duration(rng.Intn(20*24)) * time.Hour)

		projects = append(projects, models.Project{
			OwnerID:     owner.ID,
			Title:       fmt.Sprintf("Seed Project %02d", i+1),
			Status:      statuses[i%len(statuses)],
			Summary:     fmt.Sprintf("Project %02d summary for explore and feed testing.", i+1),
			Description: fmt.Sprintf("Detailed description for seed project %02d with collaboration context.", i+1),
			LogoURL:     strPtr(fmt.Sprintf("https://api.dicebear.com/9.x/shapes/svg?seed=seed-project-%d", i+1)),
			Url:         strPtr(fmt.Sprintf("https://example.com/seed-project-%02d", i+1)),
			GitHubURL:   strPtr(fmt.Sprintf("https://github.com/openflag/seed-project-%02d", i+1)),
			Tags: pq.StringArray{
				interestsPool[i%len(interestsPool)],
				skillsPool[(i+1)%len(skillsPool)],
			},
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		})
	}

	if err := db.CreateInBatches(&projects, 50).Error; err != nil {
		return fmt.Errorf("create projects: %w", err)
	}

	posts := make([]models.Post, 0, postCount)
	activityByUserDate := map[activityKey]int{}
	for i := 0; i < postCount; i++ {
		author := users[i%len(users)]
		project := projects[i%len(projects)]
		updatedAt := now.Add(-time.Duration(rng.Intn(45*24)) * time.Hour)
		createdAt := updatedAt.Add(-time.Duration(rng.Intn(36)) * time.Hour)

		dayKey := createdAt.Truncate(24 * time.Hour).Format("2006-01-02")
		activityByUserDate[activityKey{userID: author.ID, date: dayKey}]++

		var projectID *string
		if i%5 != 0 {
			projectID = &project.ID
		}

		posts = append(posts, models.Post{
			AuthorID:      author.ID,
			ProjectID:     projectID,
			Content:       fmt.Sprintf("Seed post %03d from %s sharing sprint updates.", i+1, author.Name),
			Category:      categories[i%len(categories)],
			DevlogMinutes: intPtr(15 + rng.Intn(120)),
			RefURLs:       pq.StringArray{fmt.Sprintf("https://example.com/devlog/%03d", i+1)},
			CreatedAt:     createdAt,
			UpdatedAt:     updatedAt,
		})
	}

	if err := db.CreateInBatches(&posts, 100).Error; err != nil {
		return fmt.Errorf("create posts: %w", err)
	}

	activities := make([]models.UserActivity, 0, len(activityByUserDate))
	for key, count := range activityByUserDate {
		date, err := time.Parse("2006-01-02", key.date)
		if err != nil {
			continue
		}

		activities = append(activities, models.UserActivity{
			UserID:       key.userID,
			ActivityDate: date.UTC(),
			Count:        count,
		})
	}

	if len(activities) > 0 {
		if err := db.CreateInBatches(&activities, 100).Error; err != nil {
			return fmt.Errorf("create activities: %w", err)
		}
	}

	return nil
}

func strPtr(value string) *string {
	return &value
}

func intPtr(value int) *int {
	return &value
}
