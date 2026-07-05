Connect your **Stage 5 SQLite API** to your **Stage 2–3 UI** with `fetch`. Prove the API works with Postman *before* you touch browser code.

## 1. Test the API without the browser

Start your API (`npm run dev` or equivalent). Use **Postman**, **Bruno**, **Insomnia**, or **curl**:

```bash
# List
curl http://localhost:3001/workouts

# Create
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning run","duration_min":30}'
```

Save both requests in a collection (or a `requests.http` file in the repo). Confirm GET returns JSON and POST returns `201`.

Commit: `docs: add API request collection`.

## 2. Enable CORS on the API

Your frontend likely runs on a different port than the API. Install and configure CORS:

```javascript
import cors from "cors";

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5500",
  }),
);
```

Add `WEB_ORIGIN` to `.env.example`. Restart the API and verify Postman still works (CORS does not affect curl/Postman).

Commit: `feat: enable CORS for local frontend`.

## 3. Replace mock data with fetch

Keep your render functions from Stage 2. Change only how data loads and saves:

```javascript
const API = "http://localhost:3001";

async function loadWorkouts() {
  const res = await fetch(`${API}/workouts`);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

async function createWorkout(name, durationMin) {
  const res = await fetch(`${API}/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, duration_min: durationMin }),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}
```

Wire `loadWorkouts()` on page init and `createWorkout()` on form submit. Open **Network tab** and confirm requests match your Postman tests.

Commit: `feat: wire UI to API with fetch`.

## 4. Add loading and error states

Before data arrives, show "Loading…". On failure, show a message — not a blank page:

```javascript
function showLoading() {
  listEl.innerHTML = "<p class='loading'>Loading workouts…</p>";
}

function showError(message) {
  listEl.innerHTML = `<p class="error">${message}</p>`;
}

async function init() {
  showLoading();
  try {
    const workouts = await loadWorkouts();
    if (workouts.length === 0) {
      listEl.innerHTML = "<p>No workouts yet. Add one!</p>";
    } else {
      renderWorkouts(workouts);
    }
  } catch {
    showError("Couldn't load workouts. Is the API running?");
  }
}
```

Test each state: stop the API (error), empty table (empty), normal load (success).

Commit: `feat: add loading and error UI states`.

## 5. Prove persistence end to end

1. Create a workout through the UI
2. Restart the API server
3. Refresh the browser — data is still there (SQLite from Stage 5)

## Outcome

**UI → API → database** works in the browser. You can debug any layer with Postman (API only) or Network tab (full path). Next: grow the schema with relationships, search, and pagination.
