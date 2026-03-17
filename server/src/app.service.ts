import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NestJS Server</title>
    <link rel="icon" type="image/svg+xml" href="https://nestjs.com/img/logo-small.svg" />
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
          Noto Sans, sans-serif;
        background: radial-gradient(circle at top, #fff5f8 0%, #f8fafc 55%, #eef2ff 100%);
        color: #1f2937;
      }
      .card {
        width: min(92vw, 480px);
        padding: 32px 28px;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 14px 48px rgba(15, 23, 42, 0.12);
        text-align: center;
      }
      .logo {
        width: 84px;
        height: 84px;
      }
      h1 {
        margin: 16px 0 8px;
        font-size: 1.5rem;
      }
      p {
        margin: 0;
        color: #4b5563;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <img
        class="logo"
        src="https://nestjs.com/img/logo-small.svg"
        alt="NestJS icon"
      />
      <h1>NestJS Server</h1>
      <p>Server is running.....</p>
    </main>
  </body>
</html>`;
  }
}
