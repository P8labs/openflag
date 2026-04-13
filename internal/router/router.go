package router

import (
	"net/http"

	"openflag/internal/config"
	"openflag/internal/middleware"
	authmodule "openflag/internal/modules/auth"
	"openflag/internal/modules/comments"
	"openflag/internal/modules/media"
	"openflag/internal/modules/posts"
	"openflag/internal/modules/projects"
	"openflag/internal/response"
	"openflag/internal/version"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func New(cfg config.Config, db *gorm.DB) *gin.Engine {
	if cfg.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.BaseURL, cfg.FrontendURL, "http://localhost:3000", "http://localhost:5173", "http://localhost:4173"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/", func(c *gin.Context) {
		response.Success(c, http.StatusOK, gin.H{
			"ok":        true,
			"service":   "openflag-api",
			"version":   version.Version,
			"commit":    version.Commit,
			"buildDate": version.BuildDate,
		})
	})

	r.GET("/healthz", func(c *gin.Context) {
		response.Success(c, http.StatusOK, gin.H{"ok": true})
	})

	authRepo := authmodule.NewRepository(db)
	authService := authmodule.NewService(authRepo, cfg)
	authController := authmodule.NewController(authService)
	mediaRepo := media.NewRepository(db)
	mediaService := media.NewService(mediaRepo, cfg)
	mediaController := media.NewController(mediaService)

	projectRepo := projects.NewRepository(db)
	projectService := projects.NewService(projectRepo, db, mediaService)
	projectController := projects.NewController(projectService)

	postRepo := posts.NewRepository(db)
	postService := posts.NewService(postRepo, projectService, mediaService, db)
	postController := posts.NewController(postService)

	commentRepo := comments.NewRepository(db)
	commentService := comments.NewService(commentRepo, postRepo, db)
	commentController := comments.NewController(commentService)

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.GET("/:provider/login", authController.Login)
			auth.GET("/:provider/callback", authController.Callback)
			auth.POST("/logout", authController.Logout)
		}

		protected := api.Group("")
		protected.Use(middleware.RequireAuth(authRepo))
		{
			protected.GET("/me", authController.Me)
			protected.GET("/explore", authController.Explore)
			protected.PATCH("/me/profile", authController.UpdateProfile)
			protected.GET("/me/activity", authController.Activity)
			protected.GET("/me/notifications", authController.Notifications)
			protected.GET("/me/notifications/unread-count", authController.UnreadNotificationCount)
			protected.POST("/me/notifications/read-all", authController.MarkAllNotificationsRead)
			protected.GET("/users/:username/profile", authController.PublicProfile)
			protected.GET("/me/wakatime/projects", authController.WakaTimeProjects)
			protected.POST("/me/onboarding/step", authController.CompleteOnboardingStep)
			protected.POST("/uploads/image", mediaController.UploadImage)
			protected.GET("/projects", projectController.List)
			protected.POST("/projects", projectController.Create)
			protected.GET("/projects/:id", projectController.Get)
			protected.GET("/projects/:id/tracked-time", projectController.TrackedTime)
			protected.POST("/projects/:id/star", projectController.Star)
			protected.GET("/projects/github/references", projectController.GitHubReferences)
			protected.PATCH("/projects/:id", projectController.Update)
			protected.DELETE("/projects/:id", projectController.Delete)

			protected.GET("/posts", postController.List)
			protected.POST("/posts", postController.Create)
			protected.GET("/posts/:id", postController.Get)
			protected.POST("/posts/:id/like", postController.ToggleLike)
			protected.POST("/posts/:id/quiz-vote", postController.VoteQuiz)
			protected.PATCH("/posts/:id", postController.Update)
			protected.DELETE("/posts/:id", postController.Delete)

			protected.GET("/posts/:id/comments", commentController.List)
			protected.POST("/posts/:id/comments", commentController.Create)
			protected.PATCH("/comments/:id", commentController.Update)
			protected.DELETE("/comments/:id", commentController.Delete)
		}
	}

	return r
}
