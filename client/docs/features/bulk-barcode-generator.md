# Frontend Feature: Bulk Barcode Generator

## What it does

The Bulk Barcode Generator page creates barcode batches from uploaded files or
auto-generated values, shows batch analytics, provides template downloads, and
downloads completed batches as ZIP or PDF.

Route:

```text
/dashboard/bulk-barcode-generator
```

Schema:

```text
src/modules/dashboard/schema-driven/schemas/bulk-barcode-generator.schema.ts
```

## Main components

| Component | Responsibility |
| --- | --- |
| `SchemaDrivenToolPage` | Loads the bulk barcode schema, initial list, and analytics. |
| `SchemaToolPage` | Renders the shared feature page layout. |
| `SchemaForm` | Renders upload/auto-generation fields and submits multipart or JSON payloads. |
| `SchemaUploadControl` | Drag/drop file input for CSV, XLSX, and JSON uploads. |
| `BulkBarcodeTemplateSlot` | Shows template download buttons and sample file rows. |
| `SchemaAnalyticsPanel` | Renders batch counts, activity, and export mix. |
| `BulkBarcodeUploadsHeader` | Custom upload table header. |
| `BulkBarcodeUploadRowSlot` | Renders each batch row, ZIP/PDF downloads, and delete action. |
| `SchemaDeleteModal` | Confirms batch deletion. |

## API calls

| UI action | Frontend URL | Backend URL | Method |
| --- | --- | --- | --- |
| Generate batch | `/api/features/bulk-barcodes` | `/v1/bulk-barcodes` | `POST` |
| List batches | direct server fetch to `BACKEND_API_URL/bulk-barcodes` | `/v1/bulk-barcodes` | `GET` |
| Analytics summary | direct server fetch to `BACKEND_API_URL/bulk-barcodes/analytics` | `/v1/bulk-barcodes/analytics` | `GET` |
| Activity chart | `/api/features/bulk-barcodes/analytics/activity/:period/:date` | `/v1/bulk-barcodes/analytics/activity/:period/:date` | `GET` |
| Export mix | direct server fetch to `BACKEND_API_URL/bulk-barcodes/analytics/export-mix` | `/v1/bulk-barcodes/analytics/export-mix` | `GET` |
| Template download | `/api/features/bulk-barcodes/templates/csv\|xlsx\|json` | `/v1/bulk-barcodes/templates/:type` | `GET` |
| Batch download | `/api/features/bulk-barcodes/:id/download?type=zip\|pdf` | `/v1/bulk-barcodes/:id/download?type=zip\|pdf` | `GET` |
| Delete batch | `/api/features/bulk-barcodes/:id` | `/v1/bulk-barcodes/:id` | `DELETE` |

## Schema rendering flow

```text
/dashboard/bulk-barcode-generator
  -> SchemaDrivenToolPage receives slug = "bulk-barcode-generator"
  -> getFeatureToolSchema("bulk-barcode-generator", requestHeaders)
  -> registry.ts imports schemas/bulk-barcode-generator.schema.ts
  -> loadSchemaPageData(toolSchema, requestHeaders, searchParams)
  -> getFeaturePanelSlots(toolSchema, items)
  -> SchemaToolPage renders the schema and slots together
```

`bulk-barcode-generator.schema.ts` exports a plain `toolSchema` object. The
registry imports it from the slug, and the dynamic dashboard page passes the
same schema to both the data loader and the page renderer.

`loadSchemaPageData` reads these schema APIs:

- `panels.data.api`: `GET /bulk-barcodes`, with `responsePath: "data"`
- `panels.analytics.api`: `GET /bulk-barcodes/analytics`, with
  `responsePath: "data"`
- analytics distribution API:
  `GET /bulk-barcodes/analytics/export-mix`, with `responsePath: "data"`

The activity section is rendered by `SchemaActivitySection`, which calls
`/api/features/bulk-barcodes/analytics/activity/:period/:date` from the browser.

Then `getFeaturePanelSlots` sees
`schema.slug === "bulk-barcode-generator"` and returns:

- `secondary`: `BulkBarcodeTemplateSlot`
- `dataHeader`: `BulkBarcodeUploadsHeader`
- `row`: `BulkBarcodeUploadRowSlot`
- `dataPanelHeader`: a total-count `ToolFeaturePill`
- `dataPanelDescription`: generated from the current batch count

`SchemaToolPage` combines generic and custom pieces:

- `ToolPageShell` renders the bulk barcode header.
- `SchemaForm` renders `panels.form.fields`; because one visible field can be
  type `upload`, it builds `FormData`.
- The secondary panel renders `BulkBarcodeTemplateSlot` for CSV, XLSX, and JSON
  templates.
- `SchemaAnalyticsPanel` renders summary cards, `SchemaActivitySection`, and
  `SchemaDistributionSection`.
- `SchemaDataPanel` uses `BulkBarcodeUploadsHeader` and
  `BulkBarcodeUploadRowSlot`, so each row can show ZIP/PDF download buttons and
  the delete modal.

The form schema renders:

- `generationMode` as a select with `upload` and `auto`
- `bulkFile` as an upload field, visible only when mode is `upload`
- `autoFormat` and `autoCount`, visible only when mode is `auto`
- shared rendering controls: `barWidth`, `height`, `margin`, `barColor`,
  `backgroundColor`, `showValue`

Because the schema includes an upload field, `SchemaForm` builds `FormData`.
Hidden fields with `submit.omitWhenHidden` are skipped.

## Template and download behavior

`BulkBarcodeTemplateSlot` links to template endpoints for CSV, XLSX, and JSON.

`BulkBarcodeUploadRowSlot` downloads ZIP/PDF by fetching the proxy URL as a
blob, reading `Content-Disposition` for the filename, creating an object URL,
and clicking a temporary anchor. If the backend returns `401`, it calls the auth
refresh proxy once and retries. This keeps Safari and other browsers on the
dashboard page instead of navigating to the binary URL.

## Safari ZIP/PDF download fix

Earlier, ZIP and PDF downloads were rendered as plain anchor links:

```text
<a href="/api/features/bulk-barcodes/:id/download?type=zip">
<a href="/api/features/bulk-barcodes/:id/download?type=pdf">
```

That worked in some browsers, but Safari could reload the dashboard route when
the user clicked ZIP or PDF. After the reload, the file did not download. The
problem was not in ZIP/PDF generation itself; it was in how the browser was
being handed the proxied binary response.

The fix landed in two places:

| File | Change |
| --- | --- |
| `BulkBarcodeUploadRowSlot.tsx` | Replaced direct navigation links with a controlled client-side download flow. |
| `src/app/api/features/[...path]/route.ts` | Buffers the backend response once and sets `content-length` on the proxied response. |

The row slot now:

1. Calls the same download URL with `fetch`.
2. Retries once through `/api/auth/backend/refresh-token` if the response is
   `401`.
3. Converts the response to a `Blob`.
4. Reads the filename from `Content-Disposition`.
5. Creates an object URL with `URL.createObjectURL(blob)`.
6. Clicks a temporary hidden anchor with the `download` attribute.
7. Revokes the object URL after the browser has had time to start the download.

That means the dashboard page no longer navigates to the binary endpoint, so
Safari does not reload the page during the download attempt.

The proxy change helps Safari because the response has a stable binary shape:

```text
backend response -> arrayBuffer -> NextResponse(responseBody)
response.headers.set("content-length", responseBody.byteLength)
```

Here, `responseBody` is the `ArrayBuffer` returned by:

```ts
const responseBody = await backendResponse.arrayBuffer();
```

`byteLength` is a property of `ArrayBuffer`. It tells us the exact number of
bytes in the binary response body. For example, if the backend generated a PDF
that is 250 KB, `responseBody.byteLength` is the actual byte count for that PDF
payload. If the backend generated a ZIP that is 2 MB, `byteLength` is the actual
ZIP byte count.

That value is then written into the HTTP response header:

```ts
response.headers.set("content-length", String(responseBody.byteLength));
```

`Content-Length` tells the browser how many bytes to expect before the download
is complete. This is useful for binary downloads because the browser does not
need to guess whether the response is finished or wait for a streaming boundary.
In this app, the Next.js proxy already reads the whole backend response into
memory before returning it to Safari, so it has the exact byte count available.

For bulk barcode downloads, setting `Content-Length` helps because:

- ZIP and PDF are binary files, so the browser needs a clean file boundary.
- Safari is stricter and more sensitive around proxied binary downloads.
- The frontend proxy had removed the backend `content-length` header from the
  forwarded headers.
- After buffering with `arrayBuffer()`, the proxy can safely restore an accurate
  `Content-Length` using `responseBody.byteLength`.

In short, `byteLength` comes from the buffered binary response body, and it is
used to rebuild a reliable `Content-Length` header for the browser download.

The proxy still forwards useful backend headers such as `Content-Type` and
`Content-Disposition`, while excluding hop-by-hop headers. Together, the client
blob download and explicit proxied `content-length` make ZIP/PDF downloads
reliable in Safari.

The loading UI was also adjusted after this fix. Showing the label `Preparing`
made the action buttons wider and pushed the delete button onto a new line in
small layouts. The final UI keeps the labels as `ZIP` and `PDF`, and swaps only
the active button icon to a spinner. This gives loading feedback without
changing the row width.

## Analytics mapping

The summary cards read:

| Card | Value path |
| --- | --- |
| Batches | `batches` |
| Generated | `generated` |
| Downloads | `downloads` |

The activity section calls `/bulk-barcodes/analytics/activity/:period/:date`.
The distribution section reads `exportTypeDistribution`, plus secondary
segments from `downloadFormatDistribution.zip` and
`downloadFormatDistribution.pdf`.

## Delete flow

The row slot passes the batch item to `SchemaDeleteModal`. The delete action
uses:

```text
DELETE /api/features/bulk-barcodes/:id
```

On success it dispatches `bulk-barcode-data-changed` and refreshes the page.
