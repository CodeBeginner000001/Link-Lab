# Frontend Feature: Barcode Generator

## What it does

The Barcode Generator page creates one barcode at a time, previews the latest
barcode, downloads saved barcodes as PNG or SVG, shows analytics, and lists
recent barcode records.

Route:

```text
/dashboard/barcode-generator
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/barcode-generator.schema.ts
```

This schema is async. It first calls the barcode formats API, then builds the
form options and content validation rules from the backend response.

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads schema, data, analytics, and slots. |
| `SchemaToolPage` | Renders the shared dashboard feature layout. |
| `SchemaForm` | Renders format, content, size, color, and show-value controls. |
| `BarcodeGeneratorPreviewSlot` | Shows a preview of the latest/generated barcode. |
| `BarcodePreviewCanvas` | Displays the barcode preview image/canvas. |
| `BarcodeExportActions` | Renders PNG and SVG export actions. |
| `SchemaAnalyticsPanel` | Renders summary cards, activity, and format mix. |
| `RecentBarcodesHeader` | Custom data table header. |
| `BarcodeRecentRowSlot` | Custom recent barcode row with download/delete actions. |
| `SchemaDeleteModal` | Confirms barcode deletion. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Load formats | direct service call to `BACKEND_API_URL/barcodes/formats` | `/v1/barcodes/formats` | `GET` |
| Generate barcode | `/api/features/barcodes` | `/v1/barcodes` | `POST` |
| List barcodes | direct server fetch to `BACKEND_API_URL/barcodes` | `/v1/barcodes` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/barcodes/analytics` | `/v1/barcodes/analytics` | `GET` |
| Activity chart | `/api/features/barcodes/analytics/activity/:period/:date` | `/v1/barcodes/analytics/activity/:period/:date` | `GET` |
| Format mix | direct server fetch to `BACKEND_API_URL/barcodes/analytics/format-mix` | `/v1/barcodes/analytics/format-mix` | `GET` |
| Download barcode | `/api/features/barcodes/:id/download?type=png\|svg` | `/v1/barcodes/:id/download?type=png\|svg` | `GET` |
| Preview barcode | `/api/features/barcodes/:id/preview` | `/v1/barcodes/:id/preview` | `GET` |
| Delete barcode | `/api/features/barcodes/:id` | `/v1/barcodes/:id` | `DELETE` |

## Schema rendering flow

```text
/dashboard/barcode-generator
  -> SchemaDrivenToolPage receives slug = "barcode-generator"
  -> getFeatureToolSchema("barcode-generator", requestHeaders)
  -> registry.ts imports schemas/barcode-generator.schema.ts
  -> toolSchema(headers) calls GetBarcodeFormats(headers)
  -> createBarcodeGeneratorToolSchema(formats)
  -> loadSchemaPageData(schema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(schema, items)
  -> SchemaToolPage renders the schema and slots together
```

Unlike the other static schema files, `barcode-generator.schema.ts` exports an
async `toolSchema(headers)` function. The function calls `GetBarcodeFormats`,
reads `response.result.data.formats`, and passes those formats into
`createBarcodeGeneratorToolSchema`.

That factory creates the actual schema used by the page. It also builds
`contentRulesByFormat`, which powers the `dynamicByField` behavior for the
`content` input.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /barcodes`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /barcodes/analytics`, with
  `responsePath: "data"`
- analytics distribution API: `GET /barcodes/analytics/format-mix`, with
  `responsePath: "data"`

The activity section is not loaded by `loadSchemaPageData`. It is rendered by
`SchemaActivitySection`, which calls
`/api/features/barcodes/analytics/activity/:period/:date` from the browser and
refreshes itself.

Then `getFeaturePanelSlots` sees `schema.slug === "barcode-generator"` and
returns:

- `secondary`: `BarcodeGeneratorPreviewSlot`
- `dataHeader`: `RecentBarcodesHeader`
- `row`: `BarcodeRecentRowSlot`

`SchemaToolPage` combines generic and custom pieces:

- `ToolPageShell` renders the barcode page header.
- `SchemaForm` renders the generated form schema from
  `createBarcodeGeneratorToolSchema`.
- The secondary panel renders `BarcodeGeneratorPreviewSlot`, which listens to
  `barcode-data-changed`.
- `SchemaAnalyticsPanel` renders summary cards, `SchemaActivitySection`, and
  `SchemaDistributionSection`.
- `SchemaDataPanel` uses the custom header and row function, so each barcode row
  can include preview/download/delete behavior.

The form schema renders:

- `format` as a select built from backend-supported formats
- `content` as a dynamic text input
- `barWidth`, `height`, and `margin` as numeric controls
- `barColor` and `backgroundColor` as color inputs
- `showValue` as a checkbox/toggle

`dynamicByField` connects `content` to `format`. When the selected format
changes, placeholder, input mode, uppercase behavior, min/max length, and
pattern validation change with it.

## Client events and refresh

The schema uses:

```text
successEvent: "barcode-data-changed"
```

After create/delete/download-related actions, custom slots can listen for this
event and refresh preview or activity state. `SchemaForm` also calls
`router.refresh()` after successful generation.

## Analytics mapping

The summary cards read:

| Card | Value path |
| --- | --- |
| Generated | `generated` |
| Downloads | `downloads` |
| Formats | `format` |

The activity section calls the configured API through the feature proxy. The
distribution section reads `formatDistribution` and the secondary download
segments read `downloadFormatDistribution.svg` and
`downloadFormatDistribution.png`.

## Download flow

`BarcodeRecentRowSlot` uses `GetBarcodeDownloadUrl(id, type)` to build a
same-origin proxy URL. The browser downloads PNG/SVG through `/api/features`,
which forwards cookies and response headers from the backend.
