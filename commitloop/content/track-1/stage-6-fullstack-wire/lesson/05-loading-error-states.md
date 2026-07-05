## Users notice missing states

A user opens your workouts page. The API is slow. Then it errors. Then it returns an empty array.

If your code only does:

```javascript
const workouts = await loadWorkouts();
renderWorkouts(workouts);
```

…what do they see while waiting? After failure? When the table is empty?

A blank screen feels broken. Professional UIs handle **four states**:

| State | User sees |
| --- | --- |
| **Loading** | Spinner or "Loading…" |
| **Success** | The list |
| **Empty** | "No workouts yet — add one!" |
| **Error** | "Couldn't load. Is the API running?" |

## Loading state

Show feedback **before** `await`:

```javascript
async function init() {
  showLoading();
  try {
    const workouts = await loadWorkouts();
    // ...
  } catch {
    showError("Couldn't load workouts.");
  }
}
```

Disable the submit button while a POST is in flight so users don't double-submit.

## Error state

Network failures, 500s, and CORS blocks all land in `catch`. Show a human message — not a raw stack trace.

```javascript
function showError(message) {
  listEl.innerHTML = `<p class="error" role="alert">${message}</p>`;
}
```

Log the full error to Console for yourself; keep the UI message short.

## Empty state

An empty array is **success**, not an error:

```javascript
if (workouts.length === 0) {
  listEl.innerHTML = "<p>No workouts yet. Add one below!</p>";
  return;
}
renderWorkouts(workouts);
```

## CSS hint

```css
.loading { color: var(--muted); font-style: italic; }
.error { color: var(--danger); }
```

Use CSS variables from Stage 2 — keep styling consistent.

## Test every state deliberately

1. **Loading** — throttle Network in DevTools (Slow 3G) and refresh
2. **Error** — stop the API, refresh
3. **Empty** — truncate the table in sqlite3, refresh
4. **Success** — normal flow

If you can demo all four, your wiring is production-grade for Track 1.
