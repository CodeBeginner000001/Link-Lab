type ProtectedOneTimeLinkTemplateOptions = {
  alias: string;
  errorMessage?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderProtectedOneTimeLinkPage({
  alias,
  errorMessage,
}: ProtectedOneTimeLinkTemplateOptions): string {
  const escapedAlias = escapeHtml(alias);
  const escapedError = errorMessage ? escapeHtml(errorMessage) : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Protected One-Time Link</title>
    <style>
      :root {
        color-scheme: light dark;
        --background: 210 20% 98%;
        --foreground: 220 25% 10%;
        --card: 0 0% 100%;
        --primary: 174 72% 40%;
        --primary-foreground: 0 0% 100%;
        --secondary: 220 20% 96%;
        --muted-foreground: 220 10% 45%;
        --border: 220 13% 91%;
        --input: 220 13% 91%;
        --ring: 174 72% 40%;
        --gradient-primary: linear-gradient(135deg, hsl(174, 72%, 40%) 0%, hsl(190, 90%, 45%) 50%, hsl(220, 80%, 55%) 100%);
        --shadow-card: 0 24px 80px hsl(220 25% 10% / 0.12);
        font-family: "DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        display: flex;
        min-height: 100vh;
        justify-content: center;
        align-items: center;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 20% 10%, hsl(174 72% 40% / 0.13), transparent 28rem),
          radial-gradient(circle at 86% 84%, hsl(220 80% 55% / 0.12), transparent 30rem),
          hsl(var(--background));
        color: hsl(var(--foreground));
        padding: 24px;
        -webkit-font-smoothing: antialiased;
      }

      main {
        width: min(448px, 100%);
        border: 1px solid hsl(var(--border) / 0.72);
        border-radius: 24px;
        background: hsl(var(--card) / 0.88);
        padding: 28px;
        box-shadow: var(--shadow-card);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 26px;
      }

      .logo-mark {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        box-shadow: 0 12px 34px hsl(var(--primary) / 0.28);
      }

      .brand-name {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 0;
        line-height: 1;
      }

      .gradient-text {
        background: var(--gradient-primary);
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 14px;
        border: 1px solid hsl(var(--border));
        border-radius: 999px;
        background: hsl(var(--secondary) / 0.7);
        padding: 7px 11px;
        color: hsl(var(--muted-foreground));
        font-size: 12px;
        font-weight: 700;
      }

      h2 {
        margin: 0;
        font-size: clamp(20px, 7vw, 28px);
        line-height: 1.08;
        letter-spacing: 0;
      }

      .description {
        margin: 16px 0 24px;
        color: hsl(var(--muted-foreground));
        font-size: 12px;
        line-height: 1.6;
      }

      form { display: grid; gap: 16px; }

      label {
        display: grid;
        gap: 8px;
        font-size: 12px;
        font-weight: 400;
      }

      .password-control {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        height: 46px;
        border: 1px solid hsl(var(--input));
        border-radius: 12px;
        background: hsl(var(--card));
        transition: border-color 150ms ease, box-shadow 150ms ease;
      }

      .password-control:focus-within {
        border-color: hsl(var(--ring));
        box-shadow: 0 0 0 4px hsl(var(--ring) / 0.14);
      }

      input {
        min-width: 0;
        height: 44px;
        border: 0;
        outline: 0;
        background: transparent;
        color: hsl(var(--foreground));
        padding: 0 13px;
        font: inherit;
      }

      .toggle-password {
        width: auto;
        height: 34px;
        margin: 0 6px 0 0;
        border: 1px solid hsl(var(--border));
        border-radius: 10px;
        background: hsl(var(--secondary) / 0.7);
        color: hsl(var(--muted-foreground));
        padding: 0 10px;
        font: inherit;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
      }

      .submit {
        width: 100%;
        height: 46px;
        border: 0;
        border-radius: 12px;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 16px 32px hsl(var(--primary) / 0.22);
        transition: transform 150ms ease, filter 150ms ease;
      }

      .submit:hover { filter: brightness(0.96); transform: translateY(-1px); }
      .submit:active { transform: translateY(0); }

      .error {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        border: 1px solid hsl(0 84% 60% / 0.22);
        border-radius: 12px;
        background: hsl(0 84% 60% / 0.08);
        color: hsl(0 72% 44%);
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 700;
      }

      .hint {
        margin: 18px 0 0;
        border-top: 1px solid hsl(var(--border));
        padding-top: 16px;
        color: hsl(var(--muted-foreground));
        font-size: 12px;
        line-height: 1.55;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --background: 220 25% 6%;
          --foreground: 210 20% 98%;
          --card: 220 25% 10%;
          --primary: 174 72% 50%;
          --primary-foreground: 220 25% 6%;
          --secondary: 220 20% 15%;
          --muted-foreground: 240 5% 64.9%;
          --border: 220 20% 18%;
          --input: 220 20% 18%;
          --ring: 174 72% 50%;
          --gradient-primary: linear-gradient(135deg, hsl(174, 72%, 50%) 0%, hsl(190, 90%, 55%) 50%, hsl(220, 80%, 65%) 100%);
          --shadow-card: 0 24px 80px hsl(0 0% 0% / 0.42);
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand" aria-label="LinkLab">
        <div class="logo-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
            <path d="M8 12h8" />
          </svg>
        </div>
        <div class="brand-name"><span class="gradient-text">Link</span>Lab</div>
      </div>
      <p class="eyebrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
        Protected single-use link
      </p>
      <h2>Enter the password</h2>
      <p class="description">This destination is protected. The link will expire immediately after the correct password opens it.</p>
      ${escapedError ? `<p class="error">${escapedError}</p>` : ''}
      <form method="post" action="/ot/${encodeURIComponent(escapedAlias)}/resolve">
        <label>
          Password
          <span class="password-control">
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter access password" required autofocus />
            <button class="toggle-password" type="button" aria-controls="password" aria-label="Show password">Show</button>
          </span>
        </label>
        <button class="submit" type="submit">Open One-Time Link</button>
      </form>
      <p class="hint">For your security, LinkLab never reveals the destination until the password is accepted.</p>
    </main>
    <script>
      const toggle = document.querySelector(".toggle-password");
      const password = document.querySelector("#password");
      toggle?.addEventListener("click", () => {
        const isHidden = password.type === "password";
        password.type = isHidden ? "text" : "password";
        toggle.textContent = isHidden ? "Hide" : "Show";
        toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
      });
    </script>
  </body>
</html>`;
}
