package routes

import "github.com/gofiber/fiber/v2"

func RegisterSwaggerRoutes(app *fiber.App) {

	app.Get("/docs", func(c *fiber.Ctx) error {
		return c.Type("html").SendString(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>LinkLab API Docs</title>

<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />

<style>
:root {
  --bg-light: #f8fafc;
  --bg-dark: #0f172a;
  --panel-light: #ffffff;
  --panel-dark: #020617;
  --text-light: #020617;
  --text-dark: #e5e7eb;
  --primary: #6366f1;
}

body {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont;
  background: var(--bg-light);
  color: var(--text-light);
}

body.dark {
  background: var(--bg-dark);
  color: var(--text-dark);
}

.topbar {
  display: none;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--panel-light);
  border-bottom: 1px solid #e5e7eb;
}

body.dark .header {
  background: var(--panel-dark);
  border-color: #020617;
}

.brand {
  font-weight: 600;
  font-size: 16px;
}

.toggle {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
}

.swagger-ui {
  max-width: 1200px;
  margin: auto;
}

.swagger-ui .opblock {
  border-radius: 12px;
  margin-bottom: 12px;
}

.swagger-ui .opblock-summary {
  padding: 16px;
}

body.dark .swagger-ui {
  filter: invert(0.92) hue-rotate(180deg);
}
</style>
</head>

<body>
<div class="header">
  <div class="brand">LinkLab · API Documentation</div>
  <button class="toggle" onclick="toggleTheme()">Toggle Theme</button>
</div>

<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>

<script>
const THEME_KEY = "linklab-docs-theme";

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(current === "light" ? "dark" : "light");
}

applyTheme(localStorage.getItem(THEME_KEY) || "light");

SwaggerUIBundle({
  url: "/docs/spec",
  dom_id: "#swagger-ui",
  deepLinking: true,
  defaultModelsExpandDepth: -1,
  persistAuthorization: true
});
</script>
</body>
</html>`)
	})

	app.Get("/docs/spec", serveOpenAPISpec)
}
