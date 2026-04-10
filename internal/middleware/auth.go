package middleware

import (
	"net/http"
	"strings"

	authmodule "openflag/internal/modules/auth"
	"openflag/internal/response"

	"github.com/gin-gonic/gin"
)

func RequireAuth(repo *authmodule.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c)
		if token == "" {
			if cookie, err := c.Cookie("openflag_token"); err == nil {
				token = cookie
			}
		}

		if token == "" {
			response.Fail(c, http.StatusUnauthorized, "unauthorized")
			c.Abort()
			return
		}

		session, err := repo.FindValidSessionByToken(c.Request.Context(), token)
		if err != nil {
			response.Fail(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		c.Set("user_id", session.UserID)
		c.Set("current_user", &session.User)
		c.Next()
	}
}

func bearerToken(c *gin.Context) string {
	authorization := strings.TrimSpace(c.GetHeader("Authorization"))
	if authorization == "" {
		return ""
	}

	parts := strings.Fields(authorization)
	if len(parts) != 2 {
		return ""
	}

	if !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}

	return parts[1]
}
