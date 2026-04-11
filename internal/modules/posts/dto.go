package posts

type CreateRequest struct {
	Content     string   `json:"content"`
	Category    string   `json:"category"`
	Quiz        *string  `json:"quiz"`
	Image       *string  `json:"image"`
	GitHubURL   *string  `json:"githubUrl"`
	RefURLs     []string `json:"refUrls"`
	WakatimeIDs []string `json:"wakatimeIds"`
	ProjectID   string   `json:"projectId"`
	Tags        []string `json:"tags"`
}

type UpdateRequest struct {
	Content     *string  `json:"content"`
	Category    *string  `json:"category"`
	Quiz        *string  `json:"quiz"`
	Image       *string  `json:"image"`
	GitHubURL   *string  `json:"githubUrl"`
	RefURLs     []string `json:"refUrls"`
	WakatimeIDs []string `json:"wakatimeIds"`
	ProjectID   *string  `json:"projectId"`
}

type LikeToggleResponse struct {
	Post  any  `json:"post"`
	Liked bool `json:"liked"`
}

type QuizVoteRequest struct {
	OptionIndex int `json:"optionIndex"`
}
