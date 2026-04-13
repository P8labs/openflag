package media

type UploadImageResponse struct {
	Upload ImageUploadPayload `json:"upload"`
}

type ImageUploadPayload struct {
	ID        string `json:"id"`
	Purpose   string `json:"purpose"`
	URL       string `json:"url"`
	SecureURL string `json:"secureUrl"`
	IsActive  bool   `json:"isActive"`
}
