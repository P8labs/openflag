package projects

type CreateRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	GitHubURL   string   `json:"githubUrl"`
	WakatimeID  string   `json:"wakatimeId"`
	Tags        []string `json:"tags"`
}

type UpdateRequest struct {
	Title       *string   `json:"title"`
	Description *string   `json:"description"`
	GitHubURL   *string   `json:"githubUrl"`
	WakatimeID  *string   `json:"wakatimeId"`
	Tags        *[]string `json:"tags"`
}
