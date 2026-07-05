## Wire search to the API

Stage 7 added `GET /workouts?q=run&page=1&limit=20`. Stage 10 adds the input users type into.

## Basic search on submit

```html
<form id="search-form">
  <input type="search" id="search-input" placeholder="Search workouts…" />
  <button type="submit">Search</button>
</form>
<ul id="workout-list"></ul>
```

```javascript
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  const params = new URLSearchParams({ page: "1", limit: "20" });
  if (q) params.set("q", q);
  const res = await apiFetch(`/workouts?${params}`);
  const data = await res.json();
  renderList(data.items ?? data);
});
```

## Debounce (optional upgrade)

Firing fetch on every keypress hammers the API. Debounce waits until typing pauses:

```javascript
let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(), 300);
});
```

Start with submit; add debounce if it feels sluggish.

## Empty and loading states

| State | UI |
| --- | --- |
| Loading | "Searching…" or spinner |
| Results | Render list |
| No matches | "No workouts match 'xyz'" |
| Error | Show API error message |

Same patterns as Stage 6 loading/error states — now with query params.

## Combine search + pagination

When user clicks "Next page", keep the current `q`:

```javascript
async function loadPage(page) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (currentQuery) params.set("q", currentQuery);
  // fetch and render
}
```

Reset to page 1 when the search term changes.

## Verify in Network tab

Type a query, submit, open DevTools **Network**:

- Request URL includes `?q=...`
- Status 200
- Response JSON matches what's on screen

If UI is wrong but Network looks right, bug is in render — not the API.
