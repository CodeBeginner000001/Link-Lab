package features

type URLShortenerRequest struct {
	URL   string `json:"url" validate:"required,url"`
	Alias string `json:"alias" validate:"omitempty,min=3,max=32"`
}

type URLShortenerResponse struct {
	OriginalURL string `json:"original_url"`
	Alias       string `json:"alias"`
	ShortPath   string `json:"short_path"`
	Message     string `json:"message"`
}
