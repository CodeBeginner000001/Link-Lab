type UnavailableOneTimeLinkTemplateOptions = {
  alias: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderUnavailableOneTimeLinkPage({
  alias,
}: UnavailableOneTimeLinkTemplateOptions): string {
  const escapedAlias = escapeHtml(alias);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>One-Time Link Used</title>
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
      
      .statua-mark-position {
      display: flex;
      justify-content: center;
      margin: 10px 0 0;
      }

      .status-mark {
        width: 54px;
        height: 54px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: hsl(38 92% 50% / 0.12);
        color: hsl(38 92% 42%);
        margin-bottom: 18px;
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

      h1 {
        margin: 0;
        font-size: clamp(20px, 7vw, 28px);
        line-height: 1.08;
        letter-spacing: 0;
      }

      .description {
        margin: 10px 0 22px;
        color: hsl(var(--muted-foreground));
        font-size: 12px;
        line-height: 1.6;
      }

      .alias {
        display: block;
        min-width: 0;
        border: 1px solid hsl(var(--border));
        border-radius: 12px;
        background: hsl(var(--secondary) / 0.7);
        padding: 11px 12px;
        color: hsl(var(--muted-foreground));
        font-size: 12px;
        overflow-wrap: anywhere;
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
      <p class="eyebrow">Single-use link unavailable</p>
      <h1>This link has already been used</h1>
      <div class="statua-mark-position">
       <div class="status-mark" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v5" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      </div>
      <p class="description">One-time links expire after the first successful visit. Ask the sender to generate a new link if you still need access.</p>
      <span class="alias">/ot/${escapedAlias}</span>
      <p class="hint">This page can also appear if the link was deleted or never existed.</p>
    </main>
  </body>
</html>`;
}
