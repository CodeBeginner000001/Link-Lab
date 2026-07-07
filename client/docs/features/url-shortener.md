# Frontend Feature: URL Shortener

## What it does

The URL Shortener page creates short aliases for long URLs, shows the newest
generated links, displays click analytics, and lets the user delete saved links.

Route:

```text
/dashboard/url-shortener
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/url-shortener.schema.ts
```

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads the URL shortener schema and initial data. |
| `SchemaToolPage` | Renders page shell, form panel, secondary panel, analytics, and data panel. |
| `SchemaForm` | Renders long URL and custom alias fields and submits create requests. |
| `SchemaAnalyticsPanel` | Renders total links, total clicks, and top alias cards. |
| `SchemaDataPanel` | Hosts the feature-specific data slot. |
| `URLShortenerGeneratedLinksSlot` | Shows recent/generated short links in the secondary panel. |
| `URLShortenerLinksDataSlot` | Renders the saved links list and delete actions. |
| `SchemaDeleteModal` | Confirms and performs delete requests. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Create short URL | `/api/features/short-urls` | `/v1/short-urls` | `POST` |
| List URLs | direct server fetch to `BACKEND_API_URL/short-urls` | `/v1/short-urls` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/short-urls/analytics` | `/v1/short-urls/analytics` | `GET` |
| Delete URL | `/api/features/short-urls/:id` | `/v1/short-urls/:id` | `DELETE` |
| Public redirect | `/r/[alias]` | backend redirect route | `GET` |

## Schema rendering flow

```text
/dashboard/url-shortener
  -> SchemaDrivenToolPage receives slug = "url-shortener"
  -> getFeatureToolSchema("url-shortener", requestHeaders)
  -> registry.ts imports schemas/url-shortener.schema.ts
  -> loadSchemaPageData(toolSchema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(toolSchema, items)
  -> SchemaToolPage renders the schema and slots together
```

`url-shortener.schema.ts` exports a plain `toolSchema` object. The registry
reads the schema file because its file name matches the route slug. The dynamic
dashboard page forwards cookies in `requestHeaders`, so the initial server-side
list and analytics calls are authenticated.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /short-urls`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /short-urls/analytics`, with
  `responsePath: "data"`

Then `getFeaturePanelSlots` sees `schema.slug === "url-shortener"` and returns:

- `secondary`: `URLShortenerGeneratedLinksSlot`
- `dataContent`: `URLShortenerLinksDataSlot`
- `dataPanelHeader`: a total-count `ToolFeaturePill`
- `dataPanelDescription`: generated from the current item count

`SchemaToolPage` combines the generic schema components with those slots:

- `ToolPageShell` uses `header.icon`, `header.title`, and
  `header.description`.
- `SchemaPanel` wraps the form panel from `panels.form`.
- `SchemaForm` receives `panels.form.fields`, `panels.form.api`, and
  `panels.form.submit`.
- The secondary `SchemaPanel` renders `URLShortenerGeneratedLinksSlot`.
- `SchemaAnalyticsPanel` renders cards from `panels.analytics.cards`.
- `SchemaDataPanel` renders `URLShortenerLinksDataSlot` instead of the generic
  table because the slot registry provided `dataContent`.

The form schema renders:

- `longUrl` as a required URL input
- `customAlias` as an optional text input with `^[a-zA-Z0-9-]*$`
- `submit.prefixUrlProtocol` so `example.com` becomes `https://example.com`
- `submit.omitWhenEmpty` so an empty alias is not sent

After a successful create, `SchemaForm` refreshes the route. The data loader
then reloads the list and analytics using the `short-urls` cache tag.

## Data and analytics mapping

The schema reads list data from `responsePath: "data"`. Pagination reads
`items` and `pagination`.

`mapAnalytics` converts backend analytics into the values used by cards:

| Backend field | UI field |
| --- | --- |
| `total` | `total`, `totals.links`, `activeLinks` |
| `totalClicks` | `totalClicks`, `totals.clicks` |
| `topAlias` | `topAlias` |

## Delete flow

`URLShortenerLinksDataSlot` passes the selected item to `SchemaDeleteModal`.
The modal uses the schema `deleteAction`:

```text
DELETE /api/features/short-urls/:id
```

On success it shows `Short URL deleted.` and refreshes the page.
