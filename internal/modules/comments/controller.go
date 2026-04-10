package comments

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
	comments, err := ctl.service.List(c.Request.Context(), c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"comments": comments})
}

func (ctl *Controller) Create(c *gin.Context) {
	var input CreateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	comment, err := ctl.service.Create(c.Request.Context(), c.Param("id"), c.GetString("user_id"), input)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, gin.H{"comment": comment})
}

func (ctl *Controller) Update(c *gin.Context) {
	var input UpdateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	comment, err := ctl.service.Update(c.Request.Context(), c.Param("id"), c.GetString("user_id"), input)
	if err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrCommentNotFound:
			status = http.StatusNotFound
		case ErrCommentForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"comment": comment})
}

func (ctl *Controller) Delete(c *gin.Context) {
	if err := ctl.service.Delete(c.Request.Context(), c.Param("id"), c.GetString("user_id")); err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrCommentNotFound:
			status = http.StatusNotFound
		case ErrCommentForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"success": true})
}
