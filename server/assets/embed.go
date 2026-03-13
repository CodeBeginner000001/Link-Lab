package assets

import (
	_ "embed"
	"encoding/base64"
	"fmt"
	"net/url"
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

func GolangSVGInlineDataURI() string {
	return fmt.Sprintf("data:image/svg+xml,%s", url.PathEscape(string(golangSVG)))
}

func GoServerFaviconDataURI() string {
	const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#00ADD8"/>
<rect x="8" y="8" width="48" height="48" rx="12" fill="#0B1220" opacity="0.10"/>
<text x="32" y="39" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">Go</text>
</svg>`
	return fmt.Sprintf("data:image/svg+xml,%s", url.PathEscape(favicon))
}
