# Frontend Feature: Broken Link Checker

## What it does

The Broken Link Checker page tests whether a URL is reachable, broken,
redirected, unreachable, or unsafe. It shows the latest result, analytics, and
recent checks.

Route:

```text
/dashboard/broken-link-checker
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/broken-link-checker.schema.ts
```

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads schema, recent checks, and analytics. |
| `SchemaToolPage` | Renders the shared feature layout. |
| `SchemaForm` | Renders the URL input and submits check requests. |
| `BrokenLinkCheckerResultSlot` | Shows the newest check result. |
| `SchemaAnalyticsPanel` | Renders checked, working, broken, and unsafe cards. |
| `BrokenLinkCheckerDataSlot` | Renders recent check history and delete actions. |
| `SchemaDeleteModal` | Confirms check deletion. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Check link | `/api/features/broken-link-checkers` | `/v1/broken-link-checkers` | `POST` |
| List checks | direct server fetch to `BACKEND_API_URL/broken-link-checkers` | `/v1/broken-link-checkers` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/broken-link-checkers/analytics` | `/v1/broken-link-checkers/analytics` | `GET` |
| Delete check | `/api/features/broken-link-checkers/:id` | `/v1/broken-link-checkers/:id` | `DELETE` |

## Schema rendering flow

```text
/dashboard/broken-link-checker
  -> SchemaDrivenToolPage receives slug = "broken-link-checker"
  -> getFeatureToolSchema("broken-link-checker", requestHeaders)
  -> registry.ts imports schemas/broken-link-checker.schema.ts
  -> loadSchemaPageData(toolSchema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(toolSchema, items)
  -> SchemaToolPage renders the schema and slots together
```

`broken-link-checker.schema.ts` exports a plain `toolSchema` object. The
registry imports it by matching the schema file name to the dashboard route
slug.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /broken-link-checkers`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /broken-link-checkers/analytics`, with
  `responsePath: "data"`

Then `getFeaturePanelSlots` sees
`schema.slug === "broken-link-checker"` and returns:

- `secondary`: `BrokenLinkCheckerResultSlot`
- `dataContent`: `BrokenLinkCheckerDataSlot`
- `dataPanelHeader`: a total-count `ToolFeaturePill`
- `dataPanelDescription`: generated from the current check count

`SchemaToolPage` builds the page this way:

- `ToolPageShell` renders the broken-link checker header.
- `SchemaForm` renders the single `url` field and submits to
  `panels.form.api`.
- The secondary panel renders `BrokenLinkCheckerResultSlot`, which displays the
  latest status, safety result, and destination details.
- `SchemaAnalyticsPanel` renders checked, working, broken, and unsafe cards.
- `SchemaDataPanel` renders `BrokenLinkCheckerDataSlot` because the slot
  registry provided `dataContent`.

The form schema renders `url` as a required URL input. It trims the value and
adds `https://` when no protocol is present.

The schema uses:

```text
successEvent: "broken-link-checker-data-changed"
```

This event lets custom result/list UI refresh after a successful check or
delete.

## Data displayed

Recent check items can include:

- original URL
- final URL
- HTTP status code
- broken/working status
- unsafe status and provider
- threat types
- content type, length, and disposition
- error message
- created date

## Analytics mapping

| Backend field | UI field |
| --- | --- |
| `checked` | `checked`, `totals.checked` |
| `working` | `working`, `totals.working` |
| `broken` | `broken`, `totals.broken` |
| `unsafe` | `unsafe`, `totals.unsafe` |

## Delete flow

`BrokenLinkCheckerDataSlot` passes each item to `SchemaDeleteModal`. The delete
action uses:

```text
DELETE /api/features/broken-link-checkers/:id
```

On success it dispatches `broken-link-checker-data-changed` and refreshes the
page.
