package middleware

import (
	"errors"
	"net/http"
	"strings"

	"openflag/internal/config"
	authmodule "openflag/internal/modules/auth"
	"openflag/internal/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(cfg config.Config, repo *authmodule.Repository) gin.HandlerFunc {
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

		parsed, err := jwt.Parse(token, func(parsed *jwt.Token) (any, error) {
			if _, ok := parsed.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}

			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !parsed.Valid {
			response.Fail(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}

		claims, ok := parsed.Claims.(jwt.MapClaims)
		if !ok {
			response.Fail(c, http.StatusUnauthorized, "invalid token claims")
			c.Abort()
			return
		}

		userID, _ := claims["sub"].(string)
		if userID == "" {
			response.Fail(c, http.StatusUnauthorized, "invalid token subject")
			c.Abort()
			return
		}

		user, err := repo.FindUserByID(c.Request.Context(), userID)
		if err != nil {
			response.Fail(c, http.StatusUnauthorized, "user not found")
			c.Abort()
			return
		}

		c.Set("user_id", user.ID)
		c.Set("current_user", user)
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
