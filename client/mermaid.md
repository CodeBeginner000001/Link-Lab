# LinkLab Client Architecture

## Project

LinkLab is a web dashboard that brings URL shortening, QR, barcode, link
inspection, DNS, and one-time-link tools into one authenticated workspace.

The client is built with:

- Next.js 15 App Router
- React 19 and TypeScript
- NextAuth for GitHub OAuth
- Tailwind CSS and reusable dashboard UI components
- HTTP-only cookies for access and refresh tokens, and flow-specific session cookies

## Current Feature Status

| Feature                | Client status                                          | Data path                                                            |
| ---------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Authentication         | Implemented                                            | Next.js auth proxy to NestJS                                         |
| URL Shortener          | Implemented                                            | Next.js feature proxy to NestJS                                      |
| Dashboard overview     | Placeholder route                                      | Intended to aggregate server and browser data                        |
| QR Code Generator      | Placeholder route                                      | No active implementation                                             |
| QR Code Scanner        | Placeholder                                            | Intended browser file processing and local storage                   |
| Dynamic QR Generator   | Placeholder                                            | Intended local prototype, server support required for real redirects |
| Link Expander          | Placeholder                                            | Server support required for real redirect inspection                 |
| Broken Link Checker    | Placeholder                                            | Server support required for real HTTP checks                         |
| Barcode Generator      | Placeholder                                            | Intended browser canvas and local storage                            |
| Barcode Decoder        | Placeholder                                            | Real decoder library or server support required                      |
| DNS and Domain Checker | Placeholder                                            | Server or external DNS/WHOIS service required                        |
| One-Time Links         | Placeholder                                            | Server support required for secure single-use behavior               |
| Settings               | Placeholder                                            | Intended theme, preferences, local history, and logout               |

---

## System Architecture

The client is a Next.js App Router application. Every request first passes
through the Next.js middleware (`proxy.ts`) which checks cookies and redirects
unauthenticated users before any page renders. The root layout (`app/layout.tsx`)
then resolves the current user server-side and handles the refresh redirect.
Protected dashboard pages get a second server-side user check inside the
dashboard layout (`app/(protected)/dashboard/layout.tsx`).

Two API route groups act as proxies so the browser never talks to NestJS directly:

- `/api/auth/backend/[...path]` — auth proxy with an explicit allowlist of
  permitted endpoints. Forwards cookies and enriches requests with device and
  location headers before passing them to NestJS.
- `/api/features/[...path]` — feature proxy that forwards any method and cookie
  header to the matching NestJS route path.

Client-side service calls that need an authenticated NestJS endpoint go through
`requestWithRefresh`, which transparently retries once after posting to the auth
proxy refresh route on a 401 response.

GitHub OAuth is handled by NextAuth (`/api/auth/[...nextauth]`). After NextAuth
resolves the GitHub session, the `/OAuth/github` route handler calls the NestJS
exchange endpoint directly, sets the LinkLab HTTP-only cookies, and redirects
to the dashboard.

```mermaid
flowchart LR
    User["User browser"]

    subgraph Client["LinkLab Next.js client"]
        Middleware["proxy.ts middleware\ncookie presence check"]
        RootLayout["app/layout.tsx\nresolve current user\nredirect to /refresh if needed"]
        PublicUI["Public landing page\n/"]
        AuthUI["Auth pages\n/login  /signup  /forgetpassword\n/reset-password/:token"]
        DashboardLayout["dashboard/layout.tsx\nserver-side GetCurrentUser\nredirect /login if null"]
        DashboardUI["Dashboard pages\n/dashboard/*"]
        AuthProxy["/api/auth/backend/[...path]\nallowlisted auth endpoints\ncookie + device forwarding"]
        FeatureProxy["/api/features/[...path]\ngeneric feature proxy\ncookie forwarding"]
        NextAuth["/api/auth/[...nextauth]\nNextAuth GitHub session"]
        OAuthComplete["/OAuth/github\nexchange NextAuth session\nfor LinkLab cookies"]
        RefreshRoute["/refresh\nread refresh_token cookie\ncall NestJS directly\nset new access_token"]
    end

    NestJS["NestJS API\n/v1/*"]
    GitHub["GitHub OAuth"]

    User --> Middleware
    Middleware -- public route --> RootLayout
    Middleware -- no cookies --> NestJS
    RootLayout --> PublicUI
    RootLayout --> AuthUI
    RootLayout --> DashboardLayout --> DashboardUI

    AuthUI --> AuthProxy --> NestJS
    DashboardUI --> FeatureProxy --> NestJS
    RootLayout -- access_token missing, refresh_token present --> RefreshRoute --> NestJS

    AuthUI --> NextAuth --> GitHub
    GitHub --> NextAuth --> OAuthComplete --> NestJS
    OAuthComplete -- set cookies, redirect --> DashboardUI
```

---

## Route Protection and Session Flow

The middleware runs on every non-static request. It only checks cookie
presence — not validity. The root layout performs the actual token validation
by calling `GetCurrentUser` (POST `/v1/auth/getUser`) with the access token. If
the access token is absent or invalid but a refresh token cookie exists, the
root layout redirects to `/refresh`. The `/refresh` route handler calls NestJS
`/v1/auth/refresh-token` directly with the refresh token from the cookie, sets
a new `access_token` cookie, and redirects back to the original route. The
dashboard layout repeats `GetCurrentUser` as a second guard and redirects to
`/login` if the user cannot be resolved.

Pages involved:
- `src/proxy.ts` — middleware
- `src/app/layout.tsx` — root layout, first user resolution
- `src/app/(auth)/refresh/route.ts` — token refresh route handler
- `src/app/(protected)/dashboard/layout.tsx` — protected layout, second user guard

```mermaid
flowchart TD
    Request["Incoming page request"]
    Middleware["proxy.ts\ncheck cookies"]
    PublicCheck{"isPublicRoute?"}
    CookieCheck{"access_token or\nrefresh_token cookie?"}
    RootLayout["app/layout.tsx\nGetCurrentUser(access_token)\nPOST /v1/auth/getUser"]
    UserResolved{"user resolved?"}
    RefreshCheck{"refresh_token\ncookie present?"}
    RefreshRoute["/refresh route handler\nPOST /v1/auth/refresh-token\ndirectly to NestJS"]
    RefreshOK{"refresh succeeded?"}
    SetNewCookie["set new access_token cookie"]
    RedirectOriginal["redirect to original route"]
    DashboardLayout["dashboard/layout.tsx\nGetCurrentUser(access_token)\nPOST /v1/auth/getUser"]
    DashboardUserOK{"user resolved?"}
    RenderDashboard["render dashboard page"]
    RedirectLogin["redirect to /login"]
    ClearCookies["clear auth cookies\nredirect to /login"]

    Request --> Middleware --> PublicCheck
    PublicCheck -- yes --> RootLayout
    PublicCheck -- no --> CookieCheck
    CookieCheck -- no cookies --> RedirectLogin
    CookieCheck -- cookie present --> RootLayout
    RootLayout --> UserResolved
    UserResolved -- yes --> DashboardLayout
    UserResolved -- no --> RefreshCheck
    RefreshCheck -- no --> RedirectLogin
    RefreshCheck -- yes --> RefreshRoute --> RefreshOK
    RefreshOK -- yes --> SetNewCookie --> RedirectOriginal --> RootLayout
    RefreshOK -- no --> ClearCookies
    DashboardLayout --> DashboardUserOK
    DashboardUserOK -- yes --> RenderDashboard
    DashboardUserOK -- no --> RedirectLogin
```

---

## Auth Proxy

All browser-initiated auth calls go to `/api/auth/backend/[...path]`. The route
handler maintains an explicit allowlist and rejects anything not on it. It
forwards cookies, user-agent, IP headers, and enriches requests with
`x-device-info` and `x-location-info` derived from Vercel edge headers. All
`set-cookie` headers from NestJS are forwarded back to the browser using
`getSetCookie()`.

Allowed endpoints on the auth proxy:

| Proxy path | NestJS route |
| --- | --- |
| `POST /api/auth/backend/signup` | `POST /v1/auth/signup` |
| `POST /api/auth/backend/verify-otp` | `POST /v1/auth/verify-otp` |
| `POST /api/auth/backend/resend-otp` | `POST /v1/auth/resend-otp` |
| `POST /api/auth/backend/session` | `POST /v1/auth/session` |
| `POST /api/auth/backend/login` | `POST /v1/auth/login` |
| `POST /api/auth/backend/logout` | `POST /v1/auth/logout` |
| `POST /api/auth/backend/refresh-token` | `POST /v1/auth/refresh-token` |
| `POST /api/auth/backend/forgot-password` | `POST /v1/auth/forgot-password` |
| `POST /api/auth/backend/forgot-password/verify-otp` | `POST /v1/auth/forgot-password/verify-otp` |
| `POST /api/auth/backend/forgot-password/reset-password` | `POST /v1/auth/forgot-password/reset-password` |

File: `src/app/api/auth/backend/[...path]/route.ts`

---

## Feature Proxy

Dashboard feature calls go to `/api/features/[...path]`. The proxy forwards the
full path, query string, method, body, and cookie header to the matching NestJS
route. There is no allowlist — the NestJS JWT guard handles authorization.

| Proxy path | NestJS route |
| --- | --- |
| `POST /api/features/short-urls` | `POST /v1/short-urls` |
| `GET /api/features/short-urls` | `GET /v1/short-urls` |
| `DELETE /api/features/short-urls/:id` | `DELETE /v1/short-urls/:id` |
| `PATCH /api/features/short-urls/:id` | `PATCH /v1/short-urls/:id` |

File: `src/app/api/features/[...path]/route.ts`

---

## Signup Flow

Pages involved:
- `src/app/(auth)/signup/page.tsx` → `src/modules/auth/pages/SignUp.tsx`
- `src/app/(auth)/signup/verify/page.tsx` → `src/modules/auth/pages/SignUpOTP.tsx`
- `src/modules/auth/components/SignUpForm.tsx`
- `src/modules/auth/components/OTPForm.tsx`
- `src/service/auth/index.ts` — `Signup`, `VerifySignUpOTP`, `ResendOTP`, `GetSessionData`

| Step | Client call | Proxy | NestJS |
| --- | --- | --- | --- |
| Submit signup form | `Signup(name, email, password)` | `POST /api/auth/backend/signup` | `POST /v1/auth/signup` |
| Load OTP page | `GetSessionData(cookieHeader)` | direct | `POST /v1/auth/session` |
| Resend OTP | `ResendOTP()` with `flowName: signup` | `POST /api/auth/backend/resend-otp` | `POST /v1/auth/resend-otp` |
| Submit OTP | `VerifySignUpOTP(otp)` | `POST /api/auth/backend/verify-otp` | `POST /v1/auth/verify-otp` |

```mermaid
sequenceDiagram
    actor User
    participant SignUpForm
    participant AuthProxy as /api/auth/backend
    participant NestJS as NestJS /v1/auth

    User->>SignUpForm: name, email, password
    SignUpForm->>AuthProxy: POST /signup
    AuthProxy->>NestJS: POST /signup
    NestJS-->>AuthProxy: set signup_session cookie
    AuthProxy-->>SignUpForm: 201 signup initiated
    SignUpForm-->>User: navigate to /signup/verify

    Note over SignUpForm: page load calls GetSessionData directly to NestJS
    SignUpForm->>NestJS: POST /session { flowName: signup }
    NestJS-->>SignUpForm: email, otpExpiresAt

    User->>SignUpForm: enter OTP
    SignUpForm->>AuthProxy: POST /verify-otp { otp }
    AuthProxy->>NestJS: POST /verify-otp
    NestJS-->>AuthProxy: set access_token + refresh_token cookies
    AuthProxy-->>SignUpForm: 200 verified
    SignUpForm-->>User: navigate to /dashboard
```

---

## Login Flow

Pages involved:
- `src/app/(auth)/login/page.tsx` → `src/modules/auth/pages/Login.tsx`
- `src/modules/auth/components/LoginForm.tsx`
- `src/service/auth/index.ts` — `Login`

| Step | Client call | Proxy | NestJS |
| --- | --- | --- | --- |
| Submit login | `Login(email, password)` | `POST /api/auth/backend/login` | `POST /v1/auth/login` |

```mermaid
sequenceDiagram
    actor User
    participant LoginForm
    participant AuthProxy as /api/auth/backend
    participant NestJS as NestJS /v1/auth

    User->>LoginForm: email + password
    LoginForm->>AuthProxy: POST /login
    AuthProxy->>NestJS: POST /login
    NestJS-->>AuthProxy: set access_token + refresh_token cookies, user
    AuthProxy-->>LoginForm: 200 login success
    LoginForm-->>User: navigate to /dashboard
```

---

## Logout Flow

Pages involved:
- `src/modules/dashboard/component/settings/UserSettingsClient.tsx` (or any component calling logout)
- `src/service/auth/index.ts` — `Logout`

| Step | Client call | Proxy | NestJS |
| --- | --- | --- | --- |
| Logout | `Logout()` | `POST /api/auth/backend/logout` | `POST /v1/auth/logout` |

```mermaid
sequenceDiagram
    actor User
    participant UI as Dashboard UI
    participant AuthProxy as /api/auth/backend
    participant NestJS as NestJS /v1/auth

    User->>UI: click logout
    UI->>AuthProxy: POST /logout
    AuthProxy->>NestJS: POST /logout
    NestJS-->>AuthProxy: clear auth cookies
    AuthProxy-->>UI: 200 logout success
    UI-->>User: navigate to /login
```

---

## Forgot Password Flow

Pages involved:
- `src/app/(auth)/forgetpassword/page.tsx` → `src/modules/auth/pages/ForgetPassword.tsx`
- `src/app/(auth)/forgetpassword/verify/page.tsx` → `src/modules/auth/pages/ForgetPasswordOTP.tsx`
- `src/app/(auth)/forgetpassword/success/page.tsx` → `src/modules/auth/pages/SuccessfullyResetLink.tsx`
- `src/app/(auth)/reset-password/[token]/page.tsx` → `src/modules/auth/pages/PasswordReset.tsx` or `ResetTokenExpired.tsx`
- `src/modules/auth/components/ForgetPasswordForm.tsx`
- `src/modules/auth/components/ForgetPasswordOTPForm.tsx`
- `src/service/auth/index.ts` — `ForgetPassword`, `GetForgetPasswordSessionData`, `ForgetPasswordResendOTP`, `VerifyForgetPasswordOTP`, `ValidateResetPasswordToken`, `ResetPassword`

| Step | Client call | Proxy | NestJS |
| --- | --- | --- | --- |
| Submit email | `ForgetPassword(email)` | `POST /api/auth/backend/forgot-password` | `POST /v1/auth/forgot-password` |
| Load OTP page | `GetForgetPasswordSessionData(cookieHeader)` | direct | `POST /v1/auth/session` |
| Resend OTP | `ForgetPasswordResendOTP()` with `flowName: forgot-password` | `POST /api/auth/backend/resend-otp` | `POST /v1/auth/resend-otp` |
| Submit OTP | `VerifyForgetPasswordOTP(otp)` | `POST /api/auth/backend/forgot-password/verify-otp` | `POST /v1/auth/forgot-password/verify-otp` |
| Validate reset token | `ValidateResetPasswordToken(token)` | direct to NestJS | `POST /v1/auth/forgot-password/validate-reset-token` |
| Reset password | `ResetPassword(token, password)` | `POST /api/auth/backend/forgot-password/reset-password` | `POST /v1/auth/forgot-password/reset-password` |

```mermaid
sequenceDiagram
    actor User
    participant ForgotForm
    participant AuthProxy as /api/auth/backend
    participant NestJS as NestJS /v1/auth

    User->>ForgotForm: enter email
    ForgotForm->>AuthProxy: POST /forgot-password
    AuthProxy->>NestJS: POST /forgot-password
    NestJS-->>AuthProxy: set forgot_password_session cookie
    AuthProxy-->>ForgotForm: 200 initiated
    ForgotForm-->>User: navigate to /forgetpassword/verify

    Note over ForgotForm: page load calls GetForgetPasswordSessionData directly
    ForgotForm->>NestJS: POST /session { flowName: forgot-password }
    NestJS-->>ForgotForm: email, otpExpiresAt

    User->>ForgotForm: enter OTP
    ForgotForm->>AuthProxy: POST /forgot-password/verify-otp
    AuthProxy->>NestJS: POST /forgot-password/verify-otp
    NestJS-->>AuthProxy: clear forgot_password_session cookie
    AuthProxy-->>ForgotForm: resetTokenExpiresInMinutes
    ForgotForm-->>User: navigate to /forgetpassword/success

    Note over ForgotForm: NestJS emails reset link with token
    User->>ForgotForm: open /reset-password/[token]
    ForgotForm->>NestJS: POST /forgot-password/validate-reset-token { token }
    NestJS-->>ForgotForm: email, expiresAt or 4xx if expired

    User->>ForgotForm: enter new password
    ForgotForm->>AuthProxy: POST /forgot-password/reset-password { token, password }
    AuthProxy->>NestJS: POST /forgot-password/reset-password
    NestJS-->>AuthProxy: 200 password reset
    AuthProxy-->>ForgotForm: success
    ForgotForm-->>User: navigate to /login
```

---

## GitHub OAuth Flow

Pages involved:
- `src/app/(auth)/login/page.tsx` — GitHub button triggers NextAuth sign-in
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/lib/OAuth.ts` — NextAuth config, custom GitHub token exchange, JWT/session callbacks
- `src/app/(auth)/OAuth/github/route.ts` — exchange NextAuth session for LinkLab cookies
- `src/context/OAuthWrapper.tsx` — wraps app with NextAuth SessionProvider

| Step | Where | Target |
| --- | --- | --- |
| Initiate OAuth | NextAuth `signIn("github")` | `https://github.com/login/oauth/access_token` |
| Token exchange | `OAuth.ts` custom request handler | GitHub token endpoint |
| Session complete | `/OAuth/github` GET handler | `POST /v1/auth/oauth/github/exchange` direct to NestJS |
| Set cookies | `/OAuth/github` response | `access_token` + `refresh_token` HTTP-only cookies |

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant NextAuth as /api/auth/[...nextauth]
    participant GitHub as GitHub OAuth
    participant OAuthComplete as /OAuth/github
    participant NestJS as NestJS /v1/auth

    User->>LoginPage: click Continue with GitHub
    LoginPage->>NextAuth: signIn("github")
    NextAuth->>GitHub: authorization redirect
    GitHub-->>NextAuth: code callback
    NextAuth->>GitHub: POST /login/oauth/access_token
    GitHub-->>NextAuth: access_token
    NextAuth->>GitHub: GET /user (profile)
    GitHub-->>NextAuth: id, name, email, avatar_url
    NextAuth-->>OAuthComplete: JWT session with githubId, email, name, avatar

    OAuthComplete->>NestJS: POST /oauth/github/exchange { email, name, avatar, provider, providerUserId }
    NestJS-->>OAuthComplete: accessToken + refreshToken
    OAuthComplete-->>User: set HTTP-only cookies, redirect to /dashboard
```

---

## URL Shortener Flow

Pages involved:
- `src/app/(protected)/dashboard/url-shortener/page.tsx`
- `src/modules/dashboard/pages/URLShortener.tsx` — async server component, fetches initial list
- `src/modules/dashboard/component/url-shortener/URLShortenerForm.tsx` — create link
- `src/modules/dashboard/component/url-shortener/URLShortenerUrlsPanel.tsx` — list links
- `src/modules/dashboard/component/url-shortener/URLShortenerAnalyticsPanel.tsx` — click analytics
- `src/modules/dashboard/component/url-shortener/URLShortenerDeleteModal.tsx` — confirm delete
- `src/service/dashboard/url-shortener/index.ts` — `GetUserShortUrls`, `CreateShortUrl`, `DeleteShortUrl`
- `src/service/request-with-refresh.ts` — wraps all feature calls, retries on 401

| Step | Client call | Route | NestJS |
| --- | --- | --- | --- |
| Page load (server) | `GetUserShortUrls({ Cookie })` | direct to NestJS | `GET /v1/short-urls` |
| Create short URL | `CreateShortUrl(longUrl, alias?)` | `POST /api/features/short-urls` → feature proxy | `POST /v1/short-urls` |
| Delete short URL | `DeleteShortUrl(id)` | `DELETE /api/features/short-urls/:id` → feature proxy | `DELETE /v1/short-urls/:id` |
| 401 on any call | `requestWithRefresh` retries | `POST /api/auth/backend/refresh-token` → auth proxy | `POST /v1/auth/refresh-token` |

```mermaid
sequenceDiagram
    actor User
    participant Page as URLShortener server component
    participant Form as URLShortenerForm client component
    participant FeatureProxy as /api/features
    participant AuthProxy as /api/auth/backend
    participant NestJS as NestJS /v1

    Note over Page: server render — forward Cookie header
    Page->>NestJS: GET /short-urls (direct, with Cookie)
    NestJS-->>Page: list of short URLs with analytics
    Page-->>User: render form + URL list + analytics panel

    User->>Form: enter longUrl and optional alias
    Form->>FeatureProxy: POST /short-urls { longUrl, customAlias }
    FeatureProxy->>NestJS: POST /v1/short-urls
    alt access token expired
        NestJS-->>FeatureProxy: 401 Unauthorized
        FeatureProxy-->>Form: 401
        Form->>AuthProxy: POST /refresh-token
        AuthProxy->>NestJS: POST /v1/auth/refresh-token
        NestJS-->>AuthProxy: new access_token cookie
        AuthProxy-->>Form: 200
        Form->>FeatureProxy: POST /short-urls (retry)
        FeatureProxy->>NestJS: POST /v1/short-urls
    end
    NestJS-->>FeatureProxy: created short URL
    FeatureProxy-->>Form: 201 created
    Form-->>User: refresh URL list

    User->>Form: click delete
    Form->>FeatureProxy: DELETE /short-urls/:id
    FeatureProxy->>NestJS: DELETE /v1/short-urls/:id
    NestJS-->>FeatureProxy: 200 disabled
    FeatureProxy-->>Form: 200
    Form-->>User: refresh URL list
```

---

## Dashboard Tool Pages (Placeholders)

These routes render a placeholder component. No API calls are wired. Server
support is required before real implementations can be added.

| Route | Page file | Client component |
| --- | --- | --- |
| `/dashboard` | `dashboard/page.tsx` | `DashboardOverviewClient.tsx` |
| `/dashboard/qr-code-generator` | `qr-code-generator/page.tsx` | `QrCodeGenerator.tsx` |
| `/dashboard/qr-scanner` | `qr-scanner/page.tsx` | `QRScannerClient.tsx` |
| `/dashboard/dynamic-qr` | `dynamic-qr/page.tsx` | `DynamicQRGeneratorClient.tsx` |
| `/dashboard/link-expander` | `link-expander/page.tsx` | `LinkExpanderClient.tsx` |
| `/dashboard/broken-link-checker` | `broken-link-checker/page.tsx` | `BrokenLinkCheckerClient.tsx` |
| `/dashboard/barcode-generator` | `barcode-generator/page.tsx` | `BarcodeGeneratorClient.tsx` |
| `/dashboard/barcode-decoder` | `barcode-decoder/page.tsx` | `BarcodeDecoderClient.tsx` |
| `/dashboard/dns-checker` | `dns-checker/page.tsx` | `DNSDomainCheckerClient.tsx` |
| `/dashboard/one-time-link` | `one-time-link/page.tsx` | `OneTimeLinkClient.tsx` |
| `/dashboard/settings` | `settings/page.tsx` | `UserSettingsClient.tsx` |
