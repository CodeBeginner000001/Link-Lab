# Browser ZIP/PDF Download Notes

## Goal

The bulk barcode generator needs to let users download generated exports as:

- ZIP files containing barcode assets
- PDF files containing printable barcode sheets

The files are produced by the backend and requested from the frontend through
the Next.js feature proxy:

```text
/api/features/bulk-barcodes/:id/download?type=zip
/api/features/bulk-barcodes/:id/download?type=pdf
```

## Ways to download ZIP/PDF in the browser

### 1. Direct anchor link

```tsx
<a href="/api/features/bulk-barcodes/123/download?type=zip">
  ZIP
</a>
```

How it works:

- The browser navigates to the file URL.
- If the response has `Content-Disposition: attachment`, the browser should
  download the file.

Pros:

- Very simple.
- No client-side file handling.
- Works well for many normal file downloads.

Cons:

- The current page can navigate or reload.
- Error handling is weak because the browser owns the navigation.
- If auth expires, the user may land on an error response instead of getting a
  retry.
- Browser behavior differs for binary responses, especially through proxies.

This was the earlier approach used by bulk barcode ZIP/PDF buttons.

### 2. Anchor link with `download` attribute

```tsx
<a
  href="/api/features/bulk-barcodes/123/download?type=zip"
  download="bulk-barcodes.zip"
>
  ZIP
</a>
```

How it works:

- The browser is asked to download the `href` instead of navigating to it.

Pros:

- Still simple.
- Can suggest a filename from the client.

Cons:

- The `download` attribute is less reliable for cross-origin URLs.
- It still gives limited control over auth errors and server failures.
- Some browsers may ignore it depending on response headers, origin, sandboxing,
  or security rules.

This is better than a plain anchor in some cases, but it does not fully solve
Safari/proxy/auth edge cases.

### 3. `window.location.href`

```ts
window.location.href = "/api/features/bulk-barcodes/123/download?type=pdf";
```

How it works:

- JavaScript forces the browser to navigate to the file URL.

Pros:

- Easy to trigger from a button.

Cons:

- Same navigation/reload problem as a direct anchor.
- Poor error handling.
- Not a good fit when the current dashboard page should remain in place.

This approach was not chosen because it makes the reload behavior even more
explicit.

### 4. `window.open`

```ts
window.open("/api/features/bulk-barcodes/123/download?type=pdf", "_blank");
```

How it works:

- Opens the file URL in a new tab/window.

Pros:

- Keeps the current dashboard tab open.
- Useful for files intended to preview in browser, especially PDFs.

Cons:

- Popup blockers can interfere.
- ZIP downloads in a new tab are awkward.
- Errors appear in another tab.
- It does not give the app clean loading or retry behavior.

This was not chosen because the desired behavior is a direct download from the
current UI, not a new tab.

### 5. Fetch blob and click temporary download link

```ts
const response = await fetch(downloadUrl, {
  credentials: "include",
  cache: "no-store",
});

const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = objectUrl;
link.download = filename;
document.body.appendChild(link);
link.click();
link.remove();

window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
```

How it works:

- The app fetches the binary response itself.
- The response body is converted into a `Blob`.
- A temporary object URL is created.
- A hidden anchor with `download` is clicked programmatically.
- The current page never navigates to the API URL.

Pros:

- Keeps the dashboard page in place.
- Lets the app show loading state.
- Lets the app handle errors.
- Lets the app refresh auth and retry before failing.
- Uses server filename from `Content-Disposition`.
- Works better for Safari because the browser receives a local object URL
  download instead of navigating to a proxied binary endpoint.

Cons:

- The full file is held in browser memory.
- Very large files may be less ideal than true streaming.
- More code than an anchor link.

This is the current chosen solution for bulk barcode ZIP/PDF downloads.

### 6. Stream download with File System Access API

How it works:

- The app streams response bytes directly into a file selected by the user.

Pros:

- Better for very large files.
- Avoids holding the whole file in memory.

Cons:

- Browser support is limited.
- Safari support is not suitable for this project.
- More complex UX because the user must choose a file location.

This was not chosen because compatibility matters more here.

## Problem that was faced

Bulk barcode ZIP/PDF downloads originally used direct links:

```tsx
<Button asChild>
  <a href={downloadUrl(id, "zip")}>ZIP</a>
</Button>

<Button asChild>
  <a href={downloadUrl(id, "pdf")}>PDF</a>
</Button>
```

In Safari, clicking ZIP or PDF caused the dashboard page to reload. After the
reload, no file was downloaded.

Important observation:

- The backend export generation was not the main issue.
- The issue was how Safari handled navigation to the proxied binary response.

The browser was being sent to:

```text
/api/features/bulk-barcodes/:id/download?type=zip|pdf
```

That URL goes through the Next.js proxy, which calls the backend and returns the
binary response. Safari was sensitive to this navigation/proxy/download
handoff.

## Why the direct-link approach failed

The direct-link approach relies on the browser to make several decisions:

1. Navigate to the URL.
2. Receive the proxied binary response.
3. Interpret `Content-Type`.
4. Interpret `Content-Disposition`.
5. Decide whether to download, preview, or replace/reload the current page.

That is fine when every browser handles the response the same way. Safari did
not. Since the dashboard page was navigating to the API URL, Safari could reload
the app route and still not produce a saved file.

Direct links also made it hard to:

- retry after an expired access token
- show a reliable loading state
- display a toast on failure
- avoid page navigation

## Present solution

The current solution has two parts.

### Part 1. Client-side blob download

`BulkBarcodeUploadRowSlot` now fetches the ZIP/PDF from the API route instead
of navigating to it.

Flow:

```text
User clicks ZIP/PDF
  -> fetch /api/features/bulk-barcodes/:id/download?type=zip|pdf
  -> if 401, POST /api/auth/backend/refresh-token and retry once
  -> response.blob()
  -> read filename from Content-Disposition
  -> URL.createObjectURL(blob)
  -> temporary <a download> click
  -> revoke object URL later
```

This keeps the user on the same dashboard page and gives the app control over
loading, failure, and retry behavior.

### Part 2. Proxy response content length

The Next.js feature proxy buffers the backend response once:

```ts
const responseBody = await backendResponse.arrayBuffer();

const response = new NextResponse(responseBody, {
  status: backendResponse.status,
});

response.headers.set("content-length", String(responseBody.byteLength));
```

Why this helps:

- The proxy returns a complete binary body with an exact byte length.
- Safari receives a more predictable file response.
- The proxy still forwards useful backend headers like `Content-Type` and
  `Content-Disposition`.

## Final UI adjustment

After adding loading state, the first UI used the label `Preparing` in place of
`ZIP` or `PDF`. That made the button wider and pushed the delete button onto a
new line in narrow layouts.

Final UI behavior:

- Keep labels as `ZIP` and `PDF`.
- Swap only the active button icon to a spinner.
- Keep the button width stable.

This gives the user feedback without breaking the row layout.

## Why this solution was selected

The chosen solution is the best fit for this app because:

- it works for both ZIP and PDF
- it keeps Safari on the dashboard page
- it supports auth refresh and retry
- it supports toast-based error handling
- it preserves backend filenames
- it avoids popups and new tabs
- it fits the existing Next.js proxy architecture

The tradeoff is that the browser holds the file as a blob before saving it.
For the current bulk barcode export size limits, that tradeoff is acceptable.

