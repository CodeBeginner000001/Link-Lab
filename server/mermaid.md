# LinkLab Server Architecture

## Project

The LinkLab server is a NestJS API that currently provides:

- Local signup, OTP verification, login, logout, and JWT refresh
- Forgot-password OTP and reset-link workflows
- GitHub account exchange from the NextAuth client
- Authenticated URL creation, management, redirect resolution, and analytics
- Generated SVG avatars
- Internal Redis string and hash management endpoints
- Asynchronous transactional email through AWS SQS and a Lambda mail worker
- Cron-triggered persistence of URL click analytics

MongoDB stores durable users and short URLs. Redis stores temporary auth
sessions, locks, redirect cache entries, and pending click analytics.

## Current Feature Coverage

| Product feature        | Server status                  |
| ---------------------- | ------------------------------ |
| Authentication         | Implemented                    |
| URL Shortener          | Implemented                    |
| Avatar generation      | Implemented supporting feature |
| QR Code Generator      | No server module               |
| QR Code Scanner        | No server module               |
| Dynamic QR Generator   | No server module               |
| Link Expander          | No server module               |
| Broken Link Checker    | No server module               |
| Barcode Generator      | Implemented                    |
| Barcode Decoder        | No server module               |
| DNS and Domain Checker | No server module               |
| One-Time Links         | No server module               |

---

## System Architecture

Every HTTP request enters through `RequestContextMiddleware`, which stamps a
`startTime` and `clientIp` on the request object and logs the incoming line.
Cookie parsing (`cookie-parser`) runs as Express middleware registered in
`main.ts`.

The global `JwtAuthGuard` then inspects route metadata set by the `@Public`,
`@Internal`, and default-protected decorators:

- `@Public()` — guard passes immediately, no token check
- `@Internal()` — guard passes immediately; `InternalApiMiddleware` on those
  routes separately validates the `x-internal-api-key` header
- default (protected) — guard extracts the JWT from the `Authorization: Bearer`
  header or the `access_token` cookie, verifies it with `JWT_ACCESS_SECRET`,
  and attaches the payload as `req.user`

After the guard, the global `ValidationPipe` transforms and validates DTOs with
`class-validator`. On success, `SuccessResponseInterceptor` wraps the controller
return value in a standard envelope (`success`, `statusCode`, `message`, `data`,
`timeStamp`, `path`). Routes decorated with `@SkipResponseInterceptor()` bypass
this wrapping (used by the health check, redirect, and GitHub exchange endpoints).
`LoggingInterceptor` logs every request and response duration and redacts
sensitive fields. `AllExceptionsFilter` catches everything not handled upstream
and shapes it into the standard error envelope.

Files:
- `src/main.ts` — bootstrap, CORS, cookie-parser, ValidationPipe
- `src/app.module.ts` — global filter, guard, interceptors, middleware binding
- `src/middleware/request-context.middleware.ts`
- `src/middleware/internal-api.middleware.ts`
- `src/guards/jwt-auth.guard.ts`
- `src/filters/all-exceptions.filter.ts`
- `src/interceptors/logging.interceptor.ts`
- `src/interceptors/success-response.interceptor.ts`
- `src/decorators/public.decorator.ts`
- `src/decorators/internal.decorator.ts`
- `src/decorators/skip-success-interceptor.decorator.ts`

```mermaid
flowchart TD
    Request["HTTP request"]
    ReqCtx["RequestContextMiddleware\nstamp startTime + clientIp\nlog incoming line"]
    Cookies["cookie-parser\nparse req.cookies"]
    Guard["JwtAuthGuard\nread @Public / @Internal metadata"]
    PublicPass["pass — no token check"]
    InternalPass["pass — InternalApiMiddleware\nvalidates x-internal-api-key"]
    TokenExtract["extract JWT\nBearer header or access_token cookie"]
    Verify{"jwtService.verifyAsync\nJWT_ACCESS_SECRET"}
    Attach["attach payload to req.user"]
    Unauthorized["throw AccessTokenExpired\nAllExceptionsFilter → 401"]
    Validation["ValidationPipe\nwhitelist + transform DTO"]
    Controller["Controller method"]
    Service["Domain service"]
    SuccessInterceptor["SuccessResponseInterceptor\nwrap response envelope"]
    SkipInterceptor["return raw value\n@SkipResponseInterceptor"]
    ExceptionFilter["AllExceptionsFilter\nshape error envelope"]
    LogInterceptor["LoggingInterceptor\nlog duration, redact sensitive fields"]

    Request --> ReqCtx --> Cookies --> Guard
    Guard -- "@Public" --> PublicPass --> Validation
    Guard -- "@Internal" --> InternalPass --> Validation
    Guard -- "protected" --> TokenExtract --> Verify
    Verify -- "valid" --> Attach --> Validation
    Verify -- "invalid" --> Unauthorized --> ExceptionFilter
    Validation --> Controller --> Service
    Service -- "success, no skip" --> SuccessInterceptor --> LogInterceptor
    Service -- "success, @SkipResponseInterceptor" --> SkipInterceptor --> LogInterceptor
    Service -- "exception" --> ExceptionFilter --> LogInterceptor
```

---

## MongoDB Schemas

### User — `src/models/user.schema.ts`

Collection: `users`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | required, 2–100 chars |
| `email` | String | required, unique, lowercase, indexed |
| `avatar` | String \| null | auto-set to `/v1/avatar?name=…` on pre-save if absent |
| `provider` | `local` \| `github` | default `local` |
| `providerUserId` | String \| null | unique sparse index |
| `isEmailVerified` | Boolean | default `false` |
| `lastLoginAt` | Date \| null | |
| `password` | String | optional, `select: false`, min 8 chars |
| `createdAt` | Date | timestamps |
| `updatedAt` | Date | timestamps |

Indexes: `email` (unique), `providerUserId` (unique sparse), `createdAt desc`

### ShortUrl — `src/models/short-url.schema.ts`

Collection: `short_urls`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId | ref User, indexed |
| `requestBodyHash` | String \| null | SHA-256 of request body, duplicate guard |
| `longUrl` | String | required |
| `alias` | String | required, unique, 3–32 chars, lowercase |
| `status` | `active` \| `disabled` | default `active` |
| `clicksPersisted` | Number | flushed from Redis by cron |
| `lastClickedAt` | Date \| null | |
| `createdAt` / `updatedAt` | Date | timestamps |

Compound indexes: `(userId, createdAt desc)`, `(userId, status, _id desc)`,
`(alias, status)`, `(userId, requestBodyHash, status)`

---

## Redis Key Patterns

| Key | Type | Purpose |
| --- | --- | --- |
| `signup:lock:{email}` | String | one-signup-at-a-time lock with TTL |
| `signup:session:{sessionId}` | Hash | full signup session fields |
| `fp:lock:{email}` | String | forgot-password in-progress lock |
| `fp:session:{sessionId}` | Hash | full forgot-password session fields |
| `short_url:lookup:{alias}` | String (JSON) | redirect cache entry |
| `short_url:analytics:{alias}` | Hash | `count` + `lastClickedAt` |

---

## Auth Endpoints

All endpoints live under `POST /v1/auth/…` on `AuthController`.

| Method | Route | Guard | Cookie in | Cookie out |
| --- | --- | --- | --- | --- |
| POST | `/v1/auth/signup` | `@Public` | — | `signup_session` |
| POST | `/v1/auth/verify-otp` | `@Public` | `signup_session` | clears `signup_session`, sets `access_token` + `refresh_token` |
| POST | `/v1/auth/resend-otp` | `@Public` | `signup_session` or `forgot_password_session` | — |
| POST | `/v1/auth/session` | `@Public` | `signup_session` or `forgot_password_session` | — |
| POST | `/v1/auth/login` | `@Public` | — | `access_token` + `refresh_token` |
| POST | `/v1/auth/logout` | `@Public` | — | clears all auth + flow cookies |
| POST | `/v1/auth/getUser` | protected | `access_token` (cookie or Bearer) | — |
| POST | `/v1/auth/refresh-token` | `@Public` | `refresh_token` cookie or body | `access_token` |
| POST | `/v1/auth/forgot-password` | `@Public` | — | `forgot_password_session` |
| POST | `/v1/auth/forgot-password/verify-otp` | `@Public` | `forgot_password_session` | clears `forgot_password_session` |
| POST | `/v1/auth/forgot-password/validate-reset-token` | `@Public` | — | — |
| POST | `/v1/auth/forgot-password/reset-password` | `@Public` | — | — |
| POST | `/v1/auth/oauth/github/exchange` | `@Public` + `@SkipResponseInterceptor` | — | — (tokens returned in body) |

---

## Signup Flow

Services: `SignupFlowService`, `TokenService`, `NotificationService`
Redis: `signup:lock:{email}` (String), `signup:session:{sessionId}` (Hash)
MongoDB: `users`
SQS: `VERIFY_EMAIL`, `WELCOME_EMAIL`

```mermaid
sequenceDiagram
    participant Client
    participant AuthController as AuthController\nPOST /v1/auth/signup
    participant SignupFlow as SignupFlowService
    participant Redis
    participant Mongo as MongoDB users
    participant SQS as AWS SQS

    Client->>AuthController: { name, email, password }
    AuthController->>SignupFlow: signup(dto)
    SignupFlow->>Mongo: findOne({ email }) — check duplicate
    SignupFlow->>Redis: SET NX signup:lock:{email} with TTL
    note over Redis: lock prevents concurrent signups for same email
    SignupFlow->>SignupFlow: generateOtp(), hashPassword()
    SignupFlow->>Redis: HSET signup:session:{sessionId} — full session hash
    SignupFlow->>SQS: queueSignupOtp — VERIFY_EMAIL type
    AuthController-->>Client: set signup_session cookie, 201

    Client->>AuthController: POST /v1/auth/session { flowName: signup }
    AuthController->>SignupFlow: getSignupSessionDetail(sessionId from cookie)
    SignupFlow->>Redis: HGETALL signup:session:{sessionId}
    AuthController-->>Client: { email, otpExpiresAt }

    Client->>AuthController: POST /v1/auth/verify-otp { otp }
    AuthController->>SignupFlow: verifySignupOtp(dto, sessionId)
    SignupFlow->>Redis: HGETALL signup:session:{sessionId} — validate OTP + expiry + attempts
    SignupFlow->>Mongo: create user (name, email, passwordHash, provider=local, isEmailVerified=true)
    SignupFlow->>Redis: DEL signup:session + signup:lock
    SignupFlow->>TokenService: createAccessToken + createRefreshToken
    SignupFlow->>SQS: queueWelcomeEmail — WELCOME_EMAIL type (fire and forget)
    AuthController-->>Client: clear signup_session, set access_token + refresh_token, 200
```

---

## Login Flow

Services: `AuthService`, `TokenService`
MongoDB: `users`

```mermaid
sequenceDiagram
    participant Client
    participant AuthController as AuthController\nPOST /v1/auth/login
    participant AuthService
    participant Mongo as MongoDB users
    participant TokenService

    Client->>AuthController: { email, password }
    AuthController->>AuthService: login(dto)
    AuthService->>Mongo: findOne({ email }).select("+password")
    note over AuthService: throws InvalidCredentials if not found or no password (GitHub-only account)
    AuthService->>AuthService: comparePassword(dto.password, user.password) — bcrypt
    AuthService->>Mongo: user.lastLoginAt = now, user.save()
    AuthService->>TokenService: createAccessToken + createRefreshToken
    AuthController-->>Client: set access_token + refresh_token cookies, return { message, user }
```

---

## Get Current User / Token Refresh / Logout

Services: `AuthService`, `TokenService`
MongoDB: `users`

```mermaid
flowchart TD
    GetUser["POST /v1/auth/getUser\nprotected — req.user set by JwtAuthGuard"]
    GetUserSvc["AuthService.getUser(payload)\nMongo findOne({ _id: sub, email })"]
    GetUserResp["return { user: { id, name, email, avatar, ... } }"]

    Refresh["POST /v1/auth/refresh-token\n@Public — reads refresh_token cookie or body"]
    RefreshSvc["AuthService.refreshAccessToken(refreshToken)\nTokenService.verifyRefreshToken\nMongo findOne({ _id: sub, email })"]
    RefreshResp["set new access_token cookie\nreturn { message, accessToken }"]

    Logout["POST /v1/auth/logout\n@Public"]
    LogoutSvc["res.clearCookie access_token, refresh_token,\nsignup_session, forgot_password_session"]
    LogoutResp["return { message }"]

    GetUser --> GetUserSvc --> GetUserResp
    Refresh --> RefreshSvc --> RefreshResp
    Logout --> LogoutSvc --> LogoutResp
```

---

## Forgot Password Flow

Services: `ForgotPasswordFlowService`, `TokenService`, `NotificationService`
Redis: `fp:lock:{email}` (String), `fp:session:{sessionId}` (Hash)
MongoDB: `users`
SQS: `FORGOT_PASSWORD`, `RESET_PASSWORD`, `RESET_PASSWORD` (password-changed)

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant ForgotFlow as ForgotPasswordFlowService
    participant Redis
    participant Mongo as MongoDB users
    participant TokenService
    participant SQS as AWS SQS

    Client->>AuthController: POST /v1/auth/forgot-password { email }
    AuthController->>ForgotFlow: forgotPassword(dto)
    ForgotFlow->>Mongo: findOne({ email }) — user must exist
    ForgotFlow->>Redis: SET NX fp:lock:{email} with TTL
    ForgotFlow->>ForgotFlow: generateOtp()
    ForgotFlow->>Redis: HSET fp:session:{sessionId}
    ForgotFlow->>SQS: queueForgotPasswordOtp — FORGOT_PASSWORD type
    AuthController-->>Client: set forgot_password_session cookie, 201

    Client->>AuthController: POST /v1/auth/session { flowName: forgot-password }
    AuthController->>ForgotFlow: getForgotPasswordSessionDetail(sessionId)
    ForgotFlow->>Redis: HGETALL fp:session:{sessionId}
    AuthController-->>Client: { email, otpExpiresAt }

    Client->>AuthController: POST /v1/auth/forgot-password/verify-otp { otp }
    AuthController->>ForgotFlow: verifyForgotPasswordOtp(dto, sessionId)
    ForgotFlow->>Redis: HGETALL — validate OTP + expiry + attempts
    ForgotFlow->>TokenService: createResetToken (encrypt sessionId with RESET_TOKEN_SECRET)
    ForgotFlow->>Redis: HSET isVerified=true, resetToken, resetTokenExpiresAt
    ForgotFlow->>SQS: queueResetPasswordLink — RESET_PASSWORD type\n(link = /reset-password/{encodeURIComponent(resetToken)})
    AuthController-->>Client: clear forgot_password_session, return { resetTokenExpiresInMinutes }

    Client->>AuthController: POST /v1/auth/forgot-password/validate-reset-token { token }
    AuthController->>ForgotFlow: validateResetPasswordToken(dto)
    ForgotFlow->>TokenService: decodeResetToken (decrypt token → sessionId)
    ForgotFlow->>Redis: HGETALL fp:session — check isVerified + resetToken match + expiry
    AuthController-->>Client: { message, email, expiresAt }

    Client->>AuthController: POST /v1/auth/forgot-password/reset-password { token, password }
    AuthController->>ForgotFlow: resetPassword(dto, { deviceInfo, locationInfo })
    ForgotFlow->>ForgotFlow: getValidResetContext(token) — same validation chain
    ForgotFlow->>Mongo: hashPassword + user.save()
    ForgotFlow->>Redis: DEL fp:session + fp:lock
    ForgotFlow->>SQS: queuePasswordChangedEmail — fire and forget
    AuthController-->>Client: { message, email }
```

---

## GitHub OAuth Exchange

Service: `AuthService`
MongoDB: `users`
SQS: `WELCOME_EMAIL` (new users only)

```mermaid
sequenceDiagram
    participant NextClient as Next.js /OAuth/github
    participant AuthController as AuthController\nPOST /v1/auth/oauth/github/exchange\n@Public @SkipResponseInterceptor
    participant AuthService
    participant Mongo as MongoDB users
    participant TokenService
    participant SQS as AWS SQS

    NextClient->>AuthController: { email, name, avatar, provider: github, providerUserId }
    AuthController->>AuthService: githubExchange(dto)
    AuthService->>Mongo: findOne({ provider:github, providerUserId }) + findOne({ email }) in parallel
    note over AuthService: throws conflict if two different docs found and one is not github
    alt new GitHub user
        AuthService->>Mongo: create({ email, name, avatar, provider:github, isEmailVerified:true })
        AuthService->>SQS: queueWelcomeEmail — WELCOME_EMAIL type (fire and forget)
    else existing GitHub user
        AuthService->>Mongo: update name, avatar, provider, lastLoginAt, save()
    end
    AuthService->>TokenService: createAccessToken + createRefreshToken
    AuthController-->>NextClient: { success, accessToken, refreshToken, user } (raw, not wrapped)
```

---

## URL Shortener — CRUD

Controller: `UrlShortenerController` at `/v1/short-urls` (all protected)
Service: `UrlShortenerService`
MongoDB: `short_urls`, `users`
Redis: `short_url:lookup:{alias}` (JSON String), `short_url:analytics:{alias}` (Hash)

| Method | Route | Operation |
| --- | --- | --- |
| POST | `/v1/short-urls` | create |
| GET | `/v1/short-urls` | list (cursor-paginated) |
| GET | `/v1/short-urls/:id` | get by id |
| PUT | `/v1/short-urls/:id` | update longUrl / alias |
| DELETE | `/v1/short-urls/:id` | soft-delete (set status=disabled) |

```mermaid
sequenceDiagram
    participant Client
    participant Controller as UrlShortenerController
    participant Service as UrlShortenerService
    participant Mongo as MongoDB short_urls
    participant Redis

    note over Controller,Service: all routes — JwtAuthGuard verifies user still exists in Mongo

    Client->>Controller: POST /v1/short-urls { longUrl, customAlias? }
    Controller->>Service: createShortUrl(user, dto)
    Service->>Mongo: exists({ userId, requestBodyHash, status:active }) — duplicate guard
    Service->>Mongo: create({ userId, requestBodyHash, longUrl, alias, status:active })
    Service->>Redis: SET short_url:lookup:{alias} JSON
    Service->>Redis: HSET short_url:analytics:{alias} { count:0, lastClickedAt:null }
    Controller-->>Client: 201 { message, shortUrl }

    Client->>Controller: GET /v1/short-urls?limit=N&cursor=X
    Controller->>Service: getUserShortUrls(user, query)
    Service->>Mongo: find({ userId, status:active, _id < cursor }).sort(-_id).limit(N+1)
    loop for each shortUrl
        Service->>Redis: HGETALL short_url:analytics:{alias}
    end
    Controller-->>Client: { items, pagination: { hasmore, limit, cursor } }

    Client->>Controller: PUT /v1/short-urls/:id { longUrl?, customAlias? }
    Controller->>Service: updateShortUrl(user, id, dto)
    Service->>Mongo: findById + ownership check
    alt alias changed
        Service->>Redis: HGETALL analytics for old alias — flush pending count to clicksPersisted
        Service->>Mongo: shortUrl.save() with new alias + flushed clicks
        Service->>Redis: DEL old lookup + analytics keys
        Service->>Redis: SET new lookup JSON
        Service->>Redis: HSET new analytics { count:0, lastClickedAt:null }
    else only longUrl changed
        Service->>Mongo: shortUrl.save()
        Service->>Redis: SET lookup JSON (updated longUrl)
    end
    Controller-->>Client: 200 { message, shortUrl }

    Client->>Controller: DELETE /v1/short-urls/:id
    Controller->>Service: deleteShortUrl(user, id)
    Service->>Mongo: findById + ownership check
    Service->>Redis: HGETALL analytics — flush pending count
    Service->>Mongo: set status=disabled + clicksPersisted += pendingCount, save()
    Service->>Redis: DEL lookup + analytics keys
    Controller-->>Client: 200 { message, deleted, flushedPendingClicks, shortUrl }
```

---

## URL Shortener — Public Redirect

Controller: `UrlShortenerRedirectController` at `GET /r/:alias`
Decorator: `@Public()` + `@SkipResponseInterceptor()`
Redis: `short_url:lookup:{alias}`, `short_url:analytics:{alias}`
MongoDB: `short_urls` (cache miss only)

```mermaid
sequenceDiagram
    participant Visitor
    participant RedirectCtrl as GET /r/:alias\n@Public @SkipResponseInterceptor
    participant Service as UrlShortenerService.resolveShortUrl
    participant Redis
    participant Mongo as MongoDB short_urls

    Visitor->>RedirectCtrl: GET /r/{alias}
    RedirectCtrl->>Service: resolveShortUrl(alias)
    Service->>Redis: GET short_url:lookup:{alias}
    alt cache hit and status=active
        Redis-->>Service: { longUrl }
    else cache miss
        Service->>Mongo: findOne({ alias, status:active })
        Mongo-->>Service: shortUrl
        Service->>Redis: SET short_url:lookup:{alias} JSON
    end
    Service->>Redis: HINCRBY short_url:analytics:{alias} count 1
    Service->>Redis: HSET short_url:analytics:{alias} lastClickedAt now
    RedirectCtrl-->>Visitor: HTTP 302 redirect to longUrl
```

---

## Analytics Persistence — Cron

Controller: `CronController` at `GET /v1/api/cron/url-shortener`
Decorator: `@Public()` — uses its own `Authorization: Bearer {CRON_SECRET}` check
Service: `CronJobService`
MongoDB: `short_urls`
Redis: `short_url:analytics:{alias}` (Hash)

```mermaid
sequenceDiagram
    participant Scheduler as External scheduler
    participant CronCtrl as GET /v1/api/cron/url-shortener\n@Public + CRON_SECRET check
    participant CronService as CronJobService
    participant Mongo as MongoDB short_urls
    participant Redis

    Scheduler->>CronCtrl: GET /v1/api/cron/url-shortener\nAuthorization: Bearer {CRON_SECRET}
    CronCtrl->>CronCtrl: assertAuthorized — compare header to CRON_SECRET
    CronCtrl->>CronService: flushShortedURLRedisAnalyticsToMongo()
    CronService->>Mongo: find({ status:active }).select("_id alias")
    loop for each active short URL
        CronService->>Redis: HGETALL short_url:analytics:{alias}
        alt count > 0 or lastClickedAt present
            CronService->>Mongo: updateOne $inc clicksPersisted + $set lastClickedAt
            CronService->>Redis: HSET count=0, lastClickedAt=null
        end
    end
    CronCtrl-->>Scheduler: { success, result: { processed, updated, failed }, ranAt }
```

---

## Avatar

Controller: `AvatarController` at `GET /v1/avatar`
Decorator: `@Public()`
Service: `AvatarService`

When a user is created without an explicit avatar, the `User` pre-save hook sets
`avatar = BACKEND_URL/v1/avatar?name={encodedName}`. The avatar endpoint derives
initials from the name, picks a stable background color using a hash of the name,
and returns an SVG with `Cache-Control: public, max-age=86400`.

```mermaid
flowchart LR
    UserSave["User pre-save hook\navatar absent → set /v1/avatar?name=..."]
    Request["GET /v1/avatar?name=... @Public"]
    Validate["validate name query param"]
    Initials["derive initials\n1 word → first 2 chars\n2+ words → first char of each"]
    Color["hash name → stable index\ninto 9 background colors"]
    SVG["build escaped SVG 256x256"]
    Response["return image/svg+xml\nCache-Control: public, max-age=86400"]

    UserSave --> Request
    Request --> Validate --> Initials --> Color --> SVG --> Response
```

---

## Email Delivery

Service: `NotificationService` → `SqsService` → AWS SQS → Lambda → Nodemailer

`NotificationService` renders an HTML template using `renderTemplate` (string
interpolation), then calls `SqsService.sendMail` which puts a JSON message onto
the configured SQS queue. A Lambda function polls the queue, receives a batch,
and sends each message via Nodemailer SMTP.

| Email type | SQS `type` field | Trigger |
| --- | --- | --- |
| Signup OTP | `VERIFY_EMAIL` | `SignupFlowService.signup` |
| Welcome | `WELCOME_EMAIL` | `SignupFlowService.verifySignupOtp`, `AuthService.githubExchange` |
| Forgot password OTP | `FORGOT_PASSWORD` | `ForgotPasswordFlowService.forgotPassword` |
| Reset password link | `RESET_PASSWORD` | `ForgotPasswordFlowService.verifyForgotPasswordOtp` |
| Password changed | `RESET_PASSWORD` | `ForgotPasswordFlowService.resetPassword` |

```mermaid
flowchart LR
    AuthDomain["Auth domain event\ne.g. signup, forgotPassword, resetPassword"]
    Template["NotificationService\nrenderTemplate(HTML_TEMPLATE, context)"]
    SQS["SqsService.sendMail\nSendMessageCommand → AWS SQS queue"]
    Lambda["AWS Lambda\npolls SQS batch"]
    Nodemailer["Nodemailer SMTP transport"]
    Inbox["Recipient inbox"]

    AuthDomain --> Template --> SQS --> Lambda --> Nodemailer --> Inbox
```

---

## Internal Redis API

Controllers: `RedisStringController` at `/v1/redis/string`,
`RedisHashController` at `/v1/redis/hash`
Decorators: `@Public()` + `@Internal()` — `InternalApiMiddleware` validates
`x-internal-api-key` header against `INTERNAL_API_KEY` env var

### String operations (`/v1/redis/string`)

| Method | Route | Operation |
| --- | --- | --- |
| POST | `/v1/redis/string` | create (SET with optional TTL) |
| POST | `/v1/redis/string/nx` | create if not exists (SET NX) |
| GET | `/v1/redis/string/:key` | get (parsed JSON) |
| GET | `/v1/redis/string/:key/raw` | get raw string |
| GET | `/v1/redis/string/:key/exists` | check existence |
| GET | `/v1/redis/string/:key/ttl` | get TTL |
| PUT | `/v1/redis/string` | update (SET, optional preserve TTL) |
| PATCH | `/v1/redis/string/fields` | update fields (partial JSON merge) |
| PATCH | `/v1/redis/string/expire` | set TTL |
| PATCH | `/v1/redis/string/rename` | rename key |
| DELETE | `/v1/redis/string/:key` | delete |

### Hash operations (`/v1/redis/hash`)

| Method | Route | Operation |
| --- | --- | --- |
| POST | `/v1/redis/hash` | create (HSET with optional TTL) |
| POST | `/v1/redis/hash/nx` | create if not exists |
| GET | `/v1/redis/hash/:key` | get all fields (parsed) |
| GET | `/v1/redis/hash/:key/raw` | get raw fields |
| GET | `/v1/redis/hash/:key/exists` | check existence |
| GET | `/v1/redis/hash/:key/ttl` | get TTL |
| PUT | `/v1/redis/hash` | full replace |
| PATCH | `/v1/redis/hash/fields` | update specific fields |
| PATCH | `/v1/redis/hash/fields/delete` | delete specific fields |
| PATCH | `/v1/redis/hash/expire` | set TTL |
| PATCH | `/v1/redis/hash/rename` | rename key |
| DELETE | `/v1/redis/hash/:key` | delete |

```mermaid
flowchart TD
    InternalClient["Internal caller\nsend x-internal-api-key header"]
    Middleware{"InternalApiMiddleware\nkey === INTERNAL_API_KEY?"}
    Deny["401 Unauthorized"]
    Type{"data type"}
    StringCtrl["/v1/redis/string\nRedisStringController"]
    HashCtrl["/v1/redis/hash\nRedisHashController"]
    Redis[("Redis")]

    InternalClient --> Middleware
    Middleware -- "invalid or missing" --> Deny
    Middleware -- "valid" --> Type
    Type -- "string" --> StringCtrl --> Redis
    Type -- "hash" --> HashCtrl --> Redis
```

---

## Unimplemented Features

These advertised tools have no NestJS controller, service, schema, or route.
Each will need at minimum: DTO, controller, service, persistence layer,
security rules, and tests before the client can wire real API calls.

| Feature | Suggested module path |
| --- | --- |
| QR Code Generator | `src/modules/features/qr-generator/` |
| QR Code Scanner | `src/modules/features/qr-scanner/` |
| Dynamic QR Generator | `src/modules/features/dynamic-qr/` |
| Link Expander | `src/modules/features/link-expander/` |
| Broken Link Checker | `src/modules/features/broken-link-checker/` |
| Barcode Decoder | `src/modules/features/barcode-decoder/` |
| DNS and Domain Checker | `src/modules/features/dns-checker/` |
| One-Time Links | `src/modules/features/one-time-link/` |
