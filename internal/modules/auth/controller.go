package auth

import (
	"net/http"
	"strings"

	"openflag/internal/response"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

func (ctl *Controller) Login(c *gin.Context) {
	provider := c.Param("provider")
	result, err := ctl.service.LoginURL(provider)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	ctl.setStateCookie(c, result.State)
	c.Redirect(http.StatusFound, result.AuthURL)
}

func (ctl *Controller) Callback(c *gin.Context) {
	provider := c.Param("provider")
	state := c.Query("state")
	code := c.Query("code")
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || state == "" || code == "" || stateCookie == "" || state != stateCookie {
		response.Fail(c, http.StatusBadRequest, "invalid oauth state")
		return
	}

	result, err := ctl.service.Callback(c.Request.Context(), provider, code)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	ctl.setAuthCookie(c, result.Token)
	redirectURL := strings.TrimRight(ctl.service.cfg.FrontendURL, "/") + "/auth/callback"
	c.Redirect(http.StatusFound, redirectURL)
}

func (ctl *Controller) Me(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Fail(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := ctl.service.Me(c.Request.Context(), userID.(string))
	if err != nil {
		response.Fail(c, http.StatusNotFound, err.Error())
		return
	}

	connections, err := ctl.service.Connections(c.Request.Context(), userID.(string))
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, MeResponse{User: user, Connections: connections})
}

func (ctl *Controller) CompleteOnboardingStep(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Fail(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input CompleteOnboardingStepRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := ctl.service.CompleteOnboardingStep(c.Request.Context(), userID.(string), input)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, result)
}

func (ctl *Controller) Logout(c *gin.Context) {
	token := ""
	if cookie, err := c.Cookie("openflag_token"); err == nil {
		token = cookie
	}

	if token == "" {
		token = bearerToken(c)
	}

	if err := ctl.service.Logout(c.Request.Context(), token); err != nil {
		response.Fail(c, http.StatusInternalServerError, "failed to logout")
		return
	}

	ctl.clearCookies(c)
	response.Success(c, http.StatusOK, gin.H{"success": true})
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

func (ctl *Controller) setAuthCookie(c *gin.Context, token string) {
	c.SetCookie("openflag_token", token, 60*60*24, "/", ctl.cookieDomain(), false, true)
}

func (ctl *Controller) setStateCookie(c *gin.Context, state string) {
	c.SetCookie("oauth_state", state, 300, "/", ctl.cookieDomain(), false, true)
}

func (ctl *Controller) clearCookies(c *gin.Context) {
	c.SetCookie("openflag_token", "", -1, "/", ctl.cookieDomain(), false, true)
	c.SetCookie("oauth_state", "", -1, "/", ctl.cookieDomain(), false, true)
}

func (ctl *Controller) cookieDomain() string {
	return strings.TrimSpace(ctl.service.cfg.CookieDomain)
}
