# LinkLab Frontend Architecture

## Project

The LinkLab frontend is a Next.js app that renders public marketing pages,
authentication flows, protected dashboard pages, redirect handlers, and API
proxy routes for the NestJS backend.

The protected dashboard uses a schema-driven renderer. Each feature exports a
tool schema that describes the page header, form fields, analytics cards,
activity/distribution sections, data table columns, delete behavior, and custom
slots. The shared renderer turns that schema into the final UI.

## Main frontend areas

| Area | Files | Purpose |
| --- | --- | --- |
| Public pages | `src/app/(public)`, `src/modules/home` | Landing page, hero, tools, features, pricing, CTA. |
| Auth pages | `src/app/(auth)`, `src/modules/auth` | Login, signup, OTP, forgot password, reset password, GitHub OAuth callback. |
| Protected dashboard | `src/app/(protected)/dashboard`, `src/modules/dashboard` | Dashboard shell and feature pages. |
| Schema-driven tools | `src/modules/dashboard/schema-driven` | Feature schemas, data loader, slot registry, shared schema types. |
| Feature proxy | `src/app/api/features/[...path]/route.ts` | Browser-safe proxy to backend feature endpoints. |
| Auth proxy | `src/app/api/auth/backend/[...path]/route.ts` | Browser-safe proxy to backend auth endpoints. |
| Redirect handlers | `src/app/r/[alias]/route.ts`, `src/app/ot/[alias]/route.ts` | Short URL and one-time-link redirects. |

## Feature documentation

Each dashboard feature has a frontend-specific flow document:

| Feature | Doc |
| --- | --- |
| URL Shortener | `docs/features/url-shortener.md` |
| Barcode Generator | `docs/features/barcode-generator.md` |
| Bulk Barcode Generator | `docs/features/bulk-barcode-generator.md` |
| One-Time Link Generator | `docs/features/one-time-link.md` |
| Link Expander | `docs/features/link-expander.md` |
| Broken Link Checker | `docs/features/broken-link-checker.md` |

## Routing

| Route | Renderer | Notes |
| --- | --- | --- |
| `/` | `src/app/(public)/page.tsx` -> `HomePage` | Public landing page. |
| `/login` | `src/app/(auth)/login/page.tsx` -> `Login` | Local login and GitHub login entry. |
| `/signup` | `src/app/(auth)/signup/page.tsx` -> `SignUp` | Starts signup flow. |
| `/signup/verify` | `SignUpOTP` | OTP verification for signup. |
| `/forgetpassword` | `ForgetPassword` | Starts forgot-password flow. |
| `/forgetpassword/verify` | `ForgetPasswordOTP` | OTP verification for reset flow. |
| `/forgetpassword/success` | `SuccessfullyResetLink` | Reset-link sent/success screen. |
| `/reset-password/[token]` | `PasswordReset` | Validates token and resets password. |
| `/dashboard` | `src/app/(protected)/dashboard/page.tsx` | Dashboard tool index. |
| `/dashboard/[slug]` | `SchemaDrivenToolPage` | Dynamic feature page loaded from schema. |
| `/r/[alias]` | route handler | Calls backend redirect flow for short URLs. |
| `/ot/[alias]` | route handler | Calls backend redirect flow for one-time links. |

## Auth and protection

The protected route group uses `ProtectedShell` and the dashboard layout. Auth
state is provided through `AuthUserProvider`, `OAuthWrapper`, and backend auth
cookies. Client-side auth calls go through `src/service/auth/index.ts`.

Most browser auth requests use:

```text
/api/auth/backend/:path -> BACKEND_API_URL/auth/:path
```

The auth proxy only allows known auth paths:

| Frontend proxy path | Backend path |
| --- | --- |
| `/api/auth/backend/login` | `/v1/auth/login` |
| `/api/auth/backend/logout` | `/v1/auth/logout` |
| `/api/auth/backend/signup` | `/v1/auth/signup` |
| `/api/auth/backend/session` | `/v1/auth/session` |
| `/api/auth/backend/verify-otp` | `/v1/auth/verify-otp` |
| `/api/auth/backend/resend-otp` | `/v1/auth/resend-otp` |
| `/api/auth/backend/refresh-token` | `/v1/auth/refresh-token` |
| `/api/auth/backend/forgot-password` | `/v1/auth/forgot-password` |
| `/api/auth/backend/forgot-password/verify-otp` | `/v1/auth/forgot-password/verify-otp` |
| `/api/auth/backend/forgot-password/reset-password` | `/v1/auth/forgot-password/reset-password` |

Some server-rendered checks call `BACKEND_API_URL` directly with forwarded
cookies, for example session lookups and reset-token validation.

## Feature API proxy

Feature pages submit forms and browser downloads to:

```text
/api/features/:path -> BACKEND_API_URL/:path
```

The proxy:

- forwards cookies to the backend
- forwards request body and content type
- disables backend compression with `accept-encoding: identity`
- uses `cache: "no-store"` for proxy calls
- forwards response headers, except hop-by-hop headers
- revalidates feature cache tags after mutations and bulk downloads
- returns binary responses with a known `content-length`

This lets client components call same-origin URLs while the backend remains
behind `BACKEND_API_URL`.

## Shared request helper

`src/service/request-with-refresh.ts` provides `requestWithRefresh`. It is used
by service functions that need a typed API result and automatic access-token
refresh. When a response is `401` and looks like an expired access token, the
helper calls:

```text
POST /api/auth/backend/refresh-token
```

If refresh succeeds, it retries the original request once. Schema forms do not
use this helper directly; they call `fetch` against `/api/features` and refresh
the route on success.

## Schema-driven dashboard page flow

The dynamic page is `src/app/(protected)/dashboard/[slug]/page.tsx`.

```text
1. Next receives /dashboard/[slug].
2. getFeatureToolSchema(slug, Cookie header) imports the matching schema file.
3. loadSchemaPageData(schema, headers, searchParams) loads initial data:
   - data panel API
   - analytics summary API
   - analytics distribution APIs
4. getFeaturePanelSlots(schema, items) attaches custom React slots.
5. SchemaToolPage renders the shared layout from the schema.
```

## Schema files

Feature schemas live in:

```text
src/modules/dashboard/schema-driven/schemas
```

Each schema exports `toolSchema` or an async `toolSchema(headers)` factory.
`barcode-generator.schema.ts` uses the async factory so it can load supported
barcode formats before building form options.

Schema discovery is handled by `registry.ts`. It reads schema file names and
imports only valid slugs:

```text
url-shortener.schema.ts -> /dashboard/url-shortener
barcode-generator.schema.ts -> /dashboard/barcode-generator
bulk-barcode-generator.schema.ts -> /dashboard/bulk-barcode-generator
onetime-link.schema.ts -> /dashboard/onetime-link
link-expander.schema.ts -> /dashboard/link-expander
broken-link-checker.schema.ts -> /dashboard/broken-link-checker
```

## How schema renders UI

`SchemaToolPage` renders four main page sections:

| Schema section | Component | What it renders |
| --- | --- | --- |
| `header` | `ToolPageShell` | Page icon, title, description. |
| `panels.form` | `SchemaPanel` + `SchemaForm` | Feature form from field definitions. |
| `panels.secondary` | `SchemaPanel` + custom slot | Preview/result/template/generated item panel. |
| `panels.analytics` | `SchemaAnalyticsPanel` | Metric cards, activity chart, distribution blocks. |
| `panels.data` | `SchemaDataPanel` | Generic table or feature-specific list slot. |

## Form rendering

`SchemaForm` supports these field types:

| Field type | Rendered control |
| --- | --- |
| `text`, `url`, `email`, `password` | Shared `Input` component. |
| `number` | Shared `Input` with numeric constraints. |
| `select` | Native select with schema options. |
| `color` | Shared `Input` as color input. |
| `checkbox` | Toggle-style checkbox. |
| `upload` | Drag/drop upload control. |

Field behavior is also schema-driven:

- `visibleWhen` hides or shows fields based on another field value.
- `dynamicByField` changes placeholder, validation, description, input mode,
  and uppercase behavior based on another field.
- `submit.trim` trims strings before submit.
- `submit.prefixUrlProtocol` adds `https://` when a URL has no protocol.
- `submit.omitWhenEmpty` removes empty optional values.
- `submit.omitWhenHidden` removes hidden conditional values.
- upload fields submit `FormData`; other forms submit JSON.

On success, `SchemaForm` shows a toast, dispatches the schema `successEvent`,
and calls `router.refresh()` so server-rendered data reloads.

## Analytics rendering

`SchemaAnalyticsPanel` renders:

- metric cards from `cards[].valuePath`
- activity sections from `sections[]` where `type` is `activity`
- distribution sections from `sections[]` where `type` is `distribution`

`SchemaActivitySection` is a client component. It calls its configured API
through `/api/features`, replaces `:period` and `:date` tokens in the path, and
refreshes every 10 seconds.

`SchemaDistributionSection` reads arrays and counts from analytics data by
using `valuePath`, `labelPath`, `countPath`, and `percentagePath`.

## Data panel rendering

`SchemaDataPanel` can render a generic table from `columns`, or it can delegate
to a feature slot.

Pagination is schema-driven. If `pagination.enabled` is true, the data loader
passes `page` and `limit` query params to the data API and reads results from
`itemsPath` and `paginationPath`.

Delete behavior is also schema-driven through `deleteAction`:

```text
deleteAction.api.path = "/feature/:id"
deleteAction.api.method = "DELETE"
```

The delete modal replaces `:id`, asks for confirmation, calls the proxy API,
shows success/error toasts, dispatches an optional success event, and refreshes
the page.

## Custom slots

The slot registry is `src/modules/dashboard/schema-driven/slot-registry.tsx`.
It maps a schema slug to feature-specific UI:

| Slug | Secondary slot | Data rendering |
| --- | --- | --- |
| `url-shortener` | `URLShortenerGeneratedLinksSlot` | `URLShortenerLinksDataSlot` |
| `onetime-link` | `OneTimeLinkGeneratedLinkSlot` | `OneTimeLinkDataSlot` |
| `barcode-generator` | `BarcodeGeneratorPreviewSlot` | `BarcodeRecentRowSlot` with `RecentBarcodesHeader` |
| `bulk-barcode-generator` | `BulkBarcodeTemplateSlot` | `BulkBarcodeUploadRowSlot` with `BulkBarcodeUploadsHeader` |
| `link-expander` | `LinkExpanderResultSlot` | `LinkExpanderDataSlot` |
| `broken-link-checker` | `BrokenLinkCheckerResultSlot` | `BrokenLinkCheckerDataSlot` |

## Cache and refresh

Server-rendered page data uses `next: { revalidate: 10, tags }` from schema API
config. Mutations through `/api/features` call `revalidateTag` for the matching
feature tag. `SchemaAutoRefresh` also runs on dashboard tool pages to keep data
fresh while the user remains on the page.

## Adding a new schema-driven feature

1. Create `src/modules/dashboard/schema-driven/schemas/my-feature.schema.ts`.
2. Export `toolSchema` with a unique `slug`, `route`, `header`, and `panels`.
3. Add form field definitions and the create API.
4. Add data, analytics, pagination, and delete API definitions.
5. Add custom slots only if generic panels are not enough.
6. Add the tool link to dashboard navigation/content if it should be visible.
7. Create a feature doc under `client/docs/features`.
