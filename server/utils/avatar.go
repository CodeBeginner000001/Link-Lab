package utils

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func GenerateAvatar(name string, email string) (string, error) {
	url := fmt.Sprintf(
		"https://ui-avatars.com/api/?name=%s&background=random&size=256",
		name,
	)

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	path := fmt.Sprintf("uploads/avatars/%s.png", email)

	file, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return "", err
	}

	return path, nil
}