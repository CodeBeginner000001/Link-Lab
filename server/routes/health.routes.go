package routes

import "github.com/gofiber/fiber/v2"

const healthPageHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LinkLab API Health</title>
  
  
  <style>
    :root {
      color-scheme: light;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #4b5563;
      --border: #e5e7eb;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 20px auto;
      display: grid;
      place-items: center;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      background: #ffffff;
      color: var(--text);
      padding: 24px;
    }

    .card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: min(92vw, 420px);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 10px 28px rgba(17, 24, 39, 0.08);
      padding: 28px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .logo {
      width: 160px;
      height: 80px;
      object-fit: contain;
    }

    .brand-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    h1 {
      margin: 10px 0;
      font-size: 1.2rem;
      color: #111827;
    }

    p {
    margin: 0;
      font-size: 1.02rem;
      color: var(--muted);
    }

    .dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      margin-right: 10px;
      border-radius: 999px;
      background: #1ecb6b;
      box-shadow: 0 0 0 5px rgba(30, 203, 107, 0.14);
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand-row">
      <div class="brand-text">LinkLab API</div>
    </div>
    <h1><span class="dot"></span>Server is running</h1>
    <p>Health check endpoint is available.</p>
  </main>
</body>
</html>`

func HealthCard(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.Status(fiber.StatusOK).SendString(healthPageHTML)
}
