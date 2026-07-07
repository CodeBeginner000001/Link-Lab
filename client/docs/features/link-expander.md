# Frontend Feature: Link Expander

## What it does

The Link Expander page follows a short or redirected URL and shows the final
destination before the user opens it. It also stores recent lookups and shows
summary analytics.

Route:

```text
/dashboard/link-expander
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/link-expander.schema.ts
```

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads schema, recent lookups, and analytics. |
| `SchemaToolPage` | Renders the shared feature layout. |
| `SchemaForm` | Renders the URL input and submits expand requests. |
| `LinkExpanderResultSlot` | Shows the newest expanded destination. |
| `SchemaAnalyticsPanel` | Renders expanded, redirects, and failed cards. |
| `LinkExpanderDataSlot` | Renders recent expanded links and delete actions. |
| `SchemaDeleteModal` | Confirms lookup deletion. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Expand link | `/api/features/link-expanders` | `/v1/link-expanders` | `POST` |
| List expanded links | direct server fetch to `BACKEND_API_URL/link-expanders` | `/v1/link-expanders` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/link-expanders/analytics` | `/v1/link-expanders/analytics` | `GET` |
| Delete lookup | `/api/features/link-expanders/:id` | `/v1/link-expanders/:id` | `DELETE` |

## Schema rendering flow

```text
/dashboard/link-expander
  -> SchemaDrivenToolPage receives slug = "link-expander"
  -> getFeatureToolSchema("link-expander", requestHeaders)
  -> registry.ts imports schemas/link-expander.schema.ts
  -> loadSchemaPageData(toolSchema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(toolSchema, items)
  -> SchemaToolPage renders the schema and slots together
```

`link-expander.schema.ts` exports a plain `toolSchema` object. The registry
imports it by matching the file name to the route slug.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /link-expanders`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /link-expanders/analytics`, with
  `responsePath: "data"`

Then `getFeaturePanelSlots` sees `schema.slug === "link-expander"` and returns:

- `secondary`: `LinkExpanderResultSlot`
- `dataContent`: `LinkExpanderDataSlot`
- `dataPanelHeader`: a total-count `ToolFeaturePill`
- `dataPanelDescription`: generated from the current lookup count

`SchemaToolPage` builds the page this way:

- `ToolPageShell` renders the link expander header.
- `SchemaForm` renders the single `url` field and submits to
  `panels.form.api`.
- The secondary panel renders `LinkExpanderResultSlot`, which displays the
  latest expanded destination.
- `SchemaAnalyticsPanel` renders expanded, redirects, and failed cards.
- `SchemaDataPanel` renders `LinkExpanderDataSlot` because the slot registry
  provided `dataContent`.

The form schema renders `url` as a required URL input. It trims the value and
adds `https://` when no protocol is present.

The schema uses:

```text
successEvent: "link-expander-data-changed"
```

This event lets custom slots and analytics refresh after a successful lookup or
delete.

## Analytics mapping

| Backend field | UI field |
| --- | --- |
| `total` | `total`, `totals.expanded` |
| `redirects` | `redirects`, `totals.redirects` |
| `failed` | `failed`, `totals.failed` |

## Delete flow

`LinkExpanderDataSlot` passes each item to `SchemaDeleteModal`. The delete
action uses:

```text
DELETE /api/features/link-expanders/:id
```

On success it dispatches `link-expander-data-changed` and refreshes the page.
