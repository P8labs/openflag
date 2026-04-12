package projects

import (
	"net/http"
	"strconv"

	"openflag/internal/response"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

func (ctl *Controller) List(c *gin.Context) {
	query := c.Query("q")
	limit := parsePositiveInt(c.Query("limit"), 0, 100)
	offset := parsePositiveInt(c.Query("offset"), 0, 0)

	projects, hasMore, err := ctl.service.List(c.Request.Context(), c.GetString("user_id"), query, limit, offset)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	nextOffset := 0
	if limit > 0 {
		nextOffset = offset + len(projects)
	}

	response.Success(c, http.StatusOK, gin.H{"projects": projects, "hasMore": hasMore, "nextOffset": nextOffset})
}

func parsePositiveInt(raw string, fallback int, max int) int {
	if raw == "" {
		return fallback
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value < 0 {
		return fallback
	}

	if max > 0 && value > max {
		return max
	}

	return value
}

func (ctl *Controller) Get(c *gin.Context) {
	project, err := ctl.service.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrProjectNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"project": project})
}

func (ctl *Controller) Create(c *gin.Context) {
	var input CreateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	userID := c.GetString("user_id")
	project, err := ctl.service.Create(c.Request.Context(), userID, input)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, gin.H{"project": project})
}

func (ctl *Controller) Update(c *gin.Context) {
	var input UpdateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	project, err := ctl.service.Update(c.Request.Context(), c.Param("id"), c.GetString("user_id"), input)
	if err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrProjectNotFound:
			status = http.StatusNotFound
		case ErrProjectForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"project": project})
}

func (ctl *Controller) Delete(c *gin.Context) {
	if err := ctl.service.Delete(c.Request.Context(), c.Param("id"), c.GetString("user_id")); err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrProjectNotFound:
			status = http.StatusNotFound
		case ErrProjectForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"success": true})
}

func (ctl *Controller) TrackedTime(c *gin.Context) {
	tracked, err := ctl.service.TrackedMinutes(c.Request.Context(), c.Param("id"), c.GetString("user_id"))
	if err != nil {
		status := http.StatusBadRequest
		if err == ErrProjectNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, tracked)
}

func (ctl *Controller) GitHubReferences(c *gin.Context) {
	repoURL := c.Query("repoUrl")
	if repoURL == "" {
		response.Fail(c, http.StatusBadRequest, "repoUrl is required")
		return
	}

	refs, err := ctl.service.GitHubReferences(c.Request.Context(), c.GetString("user_id"), repoURL)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"references": refs})
}

func (ctl *Controller) Star(c *gin.Context) {
	if err := ctl.service.StarGitHubProject(c.Request.Context(), c.GetString("user_id"), c.Param("id")); err != nil {
		status := http.StatusBadRequest
		if err == ErrProjectNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"starred": true})
}
