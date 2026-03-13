package assets

import (
	_ "embed"
	"encoding/base64"
	"fmt"
)

//go:embed go.png
var goPNG []byte

//go:embed golang.svg
var golangSVG []byte

func GoPNGDataURI() string {
	return fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(goPNG))
}

func GolangSVGDataURI() string {
	return fmt.Sprintf("data:image/svg+xml;base64,%s", base64.StdEncoding.EncodeToString(golangSVG))
}
