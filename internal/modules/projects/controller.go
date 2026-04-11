package projects

import (
	"net/http"

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
	projects, err := ctl.service.List(c.Request.Context())
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"projects": projects})
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
	minutes, err := ctl.service.TrackedMinutes(c.Request.Context(), c.Param("id"), c.GetString("user_id"))
	if err != nil {
		status := http.StatusBadRequest
		if err == ErrProjectNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"minutes": minutes})
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
