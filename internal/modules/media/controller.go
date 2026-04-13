package media

import (
	"io"
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

func (ctl *Controller) UploadImage(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "file is required")
		return
	}

	purpose := strings.TrimSpace(c.PostForm("purpose"))
	if purpose == "" {
		response.Fail(c, http.StatusBadRequest, "purpose is required")
		return
	}

	if fileHeader.Size <= 0 || fileHeader.Size > 10*1024*1024 {
		response.Fail(c, http.StatusBadRequest, "file size must be between 1 byte and 10MB")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "could not open file")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, "could not read file")
		return
	}

	if len(data) == 0 {
		response.Fail(c, http.StatusBadRequest, "empty file")
		return
	}

	contentType := http.DetectContentType(data)
	if !strings.HasPrefix(contentType, "image/") {
		response.Fail(c, http.StatusBadRequest, "only image uploads are allowed")
		return
	}

	upload, err := ctl.service.UploadImage(c.Request.Context(), c.GetString("user_id"), purpose, fileHeader.Filename, contentType, data)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "configured") {
			status = http.StatusServiceUnavailable
		}
		response.Fail(c, status, err.Error())
		return
	}

	response.Success(c, http.StatusOK, UploadImageResponse{
		Upload: ImageUploadPayload{
			ID:        upload.ID,
			Purpose:   upload.Purpose,
			URL:       upload.URL,
			SecureURL: upload.SecureURL,
			IsActive:  upload.IsActive,
		},
	})
}
