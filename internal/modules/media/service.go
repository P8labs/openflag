package media

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"openflag/internal/config"
	"openflag/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrInvalidUploadPurpose = errors.New("invalid image upload purpose")
	ErrInvalidUploadURL     = errors.New("image was not uploaded by current user")
)

var allowedPurposes = map[string]struct{}{
	"post-image":    {},
	"project-logo":  {},
	"project-image": {},
}

type Service struct {
	repo       *Repository
	cfg        config.Config
	httpClient *http.Client
}

func NewService(repo *Repository, cfg config.Config) *Service {
	return &Service{
		repo:       repo,
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *Service) UploadImage(ctx context.Context, userID string, purpose string, filename string, contentType string, data []byte) (*models.ImageUpload, error) {
	purpose = strings.TrimSpace(strings.ToLower(purpose))
	if _, ok := allowedPurposes[purpose]; !ok {
		return nil, ErrInvalidUploadPurpose
	}

	if strings.TrimSpace(s.cfg.CloudinaryCloud) == "" || strings.TrimSpace(s.cfg.CloudinaryAPIKey) == "" || strings.TrimSpace(s.cfg.CloudinaryAPISecret) == "" {
		return nil, errors.New("cloudinary is not configured")
	}

	timestamp := time.Now().UTC().Unix()
	publicID := uuid.NewString()
	folder := strings.Trim(strings.TrimSpace(s.cfg.CloudinaryFolder), "/") + "/" + purpose
	if strings.Trim(folder, "/") == "" {
		folder = "openflag/" + purpose
	}

	signature := cloudinarySignature(folder, publicID, timestamp, s.cfg.CloudinaryAPISecret)
	endpoint := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", s.cfg.CloudinaryCloud)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	_ = writer.WriteField("api_key", s.cfg.CloudinaryAPIKey)
	_ = writer.WriteField("timestamp", fmt.Sprintf("%d", timestamp))
	_ = writer.WriteField("folder", folder)
	_ = writer.WriteField("public_id", publicID)
	_ = writer.WriteField("signature", signature)

	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".bin"
	}

	part, err := writer.CreateFormFile("file", "upload"+ext)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(data); err != nil {
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if contentType != "" {
		req.Header.Set("X-Upload-Content-Type", contentType)
	}

	res, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 300 {
		var errorPayload struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		_ = json.Unmarshal(responseBody, &errorPayload)
		if strings.TrimSpace(errorPayload.Error.Message) != "" {
			return nil, errors.New(errorPayload.Error.Message)
		}
		return nil, errors.New("cloudinary upload failed")
	}

	var payload struct {
		AssetID      string `json:"asset_id"`
		PublicID     string `json:"public_id"`
		URL          string `json:"url"`
		SecureURL    string `json:"secure_url"`
		ResourceType string `json:"resource_type"`
		Format       string `json:"format"`
		Bytes        int64  `json:"bytes"`
		Width        int    `json:"width"`
		Height       int    `json:"height"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}

	upload := &models.ImageUpload{
		UserID:       userID,
		Provider:     "cloudinary",
		Purpose:      purpose,
		PublicID:     payload.PublicID,
		AssetID:      payload.AssetID,
		URL:          payload.URL,
		SecureURL:    payload.SecureURL,
		ResourceType: payload.ResourceType,
		Format:       payload.Format,
		Bytes:        payload.Bytes,
		Width:        payload.Width,
		Height:       payload.Height,
		IsActive:     false,
	}
	if err := s.repo.Create(ctx, upload); err != nil {
		return nil, err
	}

	return upload, nil
}

func (s *Service) MarkImageActive(ctx context.Context, userID string, secureURL string) error {
	secureURL = strings.TrimSpace(secureURL)
	if secureURL == "" || secureURL == "?" {
		return nil
	}

	if !strings.Contains(strings.ToLower(secureURL), "res.cloudinary.com") {
		return nil
	}

	upload, err := s.repo.FindByURL(ctx, userID, secureURL)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInvalidUploadURL
		}
		return err
	}

	if err := s.repo.ActivateByURL(ctx, userID, upload.SecureURL); err != nil {
		return err
	}

	return nil
}

func cloudinarySignature(folder string, publicID string, timestamp int64, apiSecret string) string {
	toSign := fmt.Sprintf("folder=%s&public_id=%s&timestamp=%d%s", folder, publicID, timestamp, apiSecret)
	hash := sha1.Sum([]byte(toSign))
	return hex.EncodeToString(hash[:])
}
