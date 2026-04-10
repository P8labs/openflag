package posts

type CreateRequest struct {
	Content    string   `json:"content"`
	Image      string   `json:"image"`
	GitHubURL  string   `json:"githubUrl"`
	PRURL      string   `json:"prUrl"`
	IssueURL   string   `json:"issueUrl"`
	WakatimeID string   `json:"wakatimeId"`
	ProjectID  string   `json:"projectId"`
	Tags       []string `json:"tags"`
}

type UpdateRequest struct {
	Content    *string `json:"content"`
	Image      *string `json:"image"`
	GitHubURL  *string `json:"githubUrl"`
	PRURL      *string `json:"prUrl"`
	IssueURL   *string `json:"issueUrl"`
	WakatimeID *string `json:"wakatimeId"`
	ProjectID  *string `json:"projectId"`
}
