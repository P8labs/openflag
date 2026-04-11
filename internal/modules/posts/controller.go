package posts

import (
	"net/http"
	"strconv"
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

func (ctl *Controller) List(c *gin.Context) {
	limit := parsePositiveInt(c.Query("limit"), 0, 100)
	offset := parsePositiveInt(c.Query("offset"), 0, 0)

	posts, hasMore, err := ctl.service.List(c.Request.Context(), c.GetString("user_id"), limit, offset)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, err.Error())
		return
	}

	nextOffset := 0
	if limit > 0 {
		nextOffset = offset + len(posts)
	}

	response.Success(c, http.StatusOK, gin.H{"posts": posts, "hasMore": hasMore, "nextOffset": nextOffset})
}

func (ctl *Controller) VoteQuiz(c *gin.Context) {
	var input QuizVoteRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	post, err := ctl.service.VoteQuiz(c.Request.Context(), c.Param("id"), c.GetString("user_id"), input.OptionIndex)
	if err != nil {
		status := http.StatusBadRequest
		switch {
		case strings.Contains(strings.ToLower(err.Error()), "already voted"):
			status = http.StatusConflict
		case strings.Contains(strings.ToLower(err.Error()), "not available"), strings.Contains(strings.ToLower(err.Error()), "invalid option"):
			status = http.StatusBadRequest
		case err == ErrPostNotFound:
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"post": post})
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
	post, err := ctl.service.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		status := http.StatusInternalServerError
		if err == ErrPostNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"post": post})
}

func (ctl *Controller) Create(c *gin.Context) {
	var input CreateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	post, err := ctl.service.Create(c.Request.Context(), c.GetString("user_id"), input)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Success(c, http.StatusCreated, gin.H{"post": post})
}

func (ctl *Controller) Update(c *gin.Context) {
	var input UpdateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Fail(c, http.StatusBadRequest, err.Error())
		return
	}

	post, err := ctl.service.Update(c.Request.Context(), c.Param("id"), c.GetString("user_id"), input)
	if err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrPostNotFound:
			status = http.StatusNotFound
		case ErrPostForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"post": post})
}

func (ctl *Controller) Delete(c *gin.Context) {
	if err := ctl.service.Delete(c.Request.Context(), c.Param("id"), c.GetString("user_id")); err != nil {
		status := http.StatusBadRequest
		switch err {
		case ErrPostNotFound:
			status = http.StatusNotFound
		case ErrPostForbidden:
			status = http.StatusForbidden
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"success": true})
}

func (ctl *Controller) ToggleLike(c *gin.Context) {
	post, liked, err := ctl.service.ToggleLike(c.Request.Context(), c.Param("id"), c.GetString("user_id"))
	if err != nil {
		status := http.StatusBadRequest
		if err == ErrPostNotFound {
			status = http.StatusNotFound
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, gin.H{"post": post, "liked": liked})
}
