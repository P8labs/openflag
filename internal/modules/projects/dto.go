package projects

type CreateRequest struct {
	Title       string   `json:"title"`
	Status      string   `json:"status"`
	Description string   `json:"description"`
	Summary     string   `json:"summary"`
	LogoURL     string   `json:"logoUrl"`
	ProjectURL  string   `json:"projectUrl"`
	ImageURL    string   `json:"imageUrl"`
	VideoURL    string   `json:"videoUrl"`
	GitHubURL   string   `json:"githubUrl"`
	WakatimeIDs []string `json:"wakatimeIds"`
	Tags        []string `json:"tags"`
}

type UpdateRequest struct {
	Title       *string   `json:"title"`
	Status      *string   `json:"status"`
	Description *string   `json:"description"`
	LogoURL     *string   `json:"logoUrl"`
	ProjectURL  *string   `json:"projectUrl"`
	Image       *string   `json:"image"`
	ImageURL    *string   `json:"imageUrl"`
	Video       *string   `json:"video"`
	VideoURL    *string   `json:"videoUrl"`
	GitHubURL   *string   `json:"githubUrl"`
	WakatimeIDs *[]string `json:"wakatimeIds"`
	Tags        *[]string `json:"tags"`
}

type GitHubReference struct {
	Number int    `json:"number"`
	Title  string `json:"title"`
	URL    string `json:"url"`
}

type GitHubReferencesResponse struct {
	Owner  string            `json:"owner"`
	Repo   string            `json:"repo"`
	PRs    []GitHubReference `json:"prs"`
	Issues []GitHubReference `json:"issues"`
}
