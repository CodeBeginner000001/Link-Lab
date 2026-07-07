# Frontend Feature: One-Time Link Generator

## What it does

The One-Time Link page creates links that expire after one successful use. A
link can optionally require a password before redirecting to the destination.

Route:

```text
/dashboard/onetime-link
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/onetime-link.schema.ts
```

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads the one-time link schema and initial data. |
| `SchemaToolPage` | Renders the shared dashboard feature layout. |
| `SchemaForm` | Renders URL, password, and password-protect toggle. |
| `OneTimeLinkGeneratedLinkSlot` | Shows the latest generated one-time URL. |
| `SchemaAnalyticsPanel` | Renders generated/protected/used metrics. |
| `OneTimeLinkDataSlot` | Renders saved one-time links and status details. |
| `SchemaDeleteModal` | Confirms one-time-link deletion. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Create one-time link | `/api/features/one-time-links` | `/v1/one-time-links` | `POST` |
| List one-time links | direct server fetch to `BACKEND_API_URL/one-time-links` | `/v1/one-time-links` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/one-time-links/analytics` | `/v1/one-time-links/analytics` | `GET` |
| Delete one-time link | `/api/features/one-time-links/:id` | `/v1/one-time-links/:id` | `DELETE` |
| Public redirect | `/ot/[alias]` | backend one-time redirect route | `GET` |

## Schema rendering flow

```text
/dashboard/onetime-link
  -> SchemaDrivenToolPage receives slug = "onetime-link"
  -> getFeatureToolSchema("onetime-link", requestHeaders)
  -> registry.ts imports schemas/onetime-link.schema.ts
  -> loadSchemaPageData(toolSchema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(toolSchema, items)
  -> SchemaToolPage renders the schema and slots together
```

`onetime-link.schema.ts` exports a plain `toolSchema` object. The registry reads
it from the route slug, then the dashboard page uses the same schema for
server-side data loading and UI rendering.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /one-time-links`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /one-time-links/analytics`, with
  `responsePath: "data"`

Then `getFeaturePanelSlots` sees `schema.slug === "onetime-link"` and returns:

- `secondary`: `OneTimeLinkGeneratedLinkSlot`
- `dataContent`: `OneTimeLinkDataSlot`
- `dataPanelHeader`: a total-count `ToolFeaturePill`
- `dataPanelDescription`: generated from the current item count

`SchemaToolPage` builds the page this way:

- `ToolPageShell` renders the one-time-link header.
- `SchemaForm` renders `originalUrl`, `password`, and `passwordProtect` from
  `panels.form.fields`.
- The secondary panel renders `OneTimeLinkGeneratedLinkSlot`, which uses the
  newest item from the loaded list.
- `SchemaAnalyticsPanel` renders generated/protected/used metric cards.
- `SchemaDataPanel` renders `OneTimeLinkDataSlot` because the slot registry
  provided `dataContent`.

The form schema renders:

- `originalUrl` as a required URL input
- `passwordProtect` as a checkbox/toggle
- `password` as a required password field only when `passwordProtect` is true

`originalUrl` uses `submit.prefixUrlProtocol`, so users can paste
`example.com` and submit `https://example.com`.

`password` uses `submit.omitWhenHidden`, so the password field is not included
when password protection is off.

## Analytics mapping

`mapAnalytics` maps backend totals into UI fields:

| Backend field | UI field |
| --- | --- |
| `total` | `total`, `totals.generated` |
| `protected` | `protected`, `totals.protected` |
| `used` | `used`, `totals.used` |
| `notUsed` | `notUsed`, `totals.notUsed` |

## Redirect flow

The generated one-time URL eventually points to `/ot/[alias]`. The route
handler asks the backend whether the alias is valid, used, password protected,
or unavailable, then returns the appropriate redirect or response.

## Delete flow

`OneTimeLinkDataSlot` passes the selected item to `SchemaDeleteModal`.
The delete action uses:

```text
DELETE /api/features/one-time-links/:id
```
