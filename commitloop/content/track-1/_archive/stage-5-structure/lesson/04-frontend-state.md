## Data has four faces

A page that fetches from an API is never just "show the list." Real data goes through states:

| State | What the user sees |
| --- | --- |
| **Loading** | Spinner or skeleton — a fetch is in flight |
| **Error** | Something went wrong — network down, 500, etc. |
| **Empty** | Fetch succeeded, but the list has zero items |
| **Success** | The populated list (or detail view) |

If you only handle success, the app feels broken the moment anything unexpected happens.

## A minimal state machine

```javascript
const [workouts, setWorkouts] = useState([]);
const [status, setStatus] = useState("loading"); // loading | error | empty | ready
const [error, setError] = useState(null);

useEffect(() => {
  fetch("/api/workouts")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.length === 0) {
        setStatus("empty");
      } else {
        setWorkouts(data);
        setStatus("ready");
      }
    })
    .catch((err) => {
      setError(err.message);
      setStatus("error");
    });
}, []);
```

Then render based on `status`:

```javascript
if (status === "loading") return <p>Loading…</p>;
if (status === "error") return <p>Error: {error}</p>;
if (status === "empty") return <p>No workouts yet. Add one below.</p>;
return <WorkoutList items={workouts} />;
```

## Don't duplicate server state blindly

For this stage, `useState` + `useEffect` is enough. As apps grow, you might reach for:

- **React Query / SWR** — caching, refetching, deduplication
- **Context** — sharing user/session across pages

The principle stays the same: **explicitly model** what your UI is doing with data. "It usually works" is not a state.

## Forms need states too

When the user submits a create form:

- **Submitting** — disable the button, show feedback
- **Validation error** — show field-level messages (from 400 response)
- **Success** — clear the form, refresh the list

```javascript
const [saving, setSaving] = useState(false);

async function handleSubmit(e) {
  e.preventDefault();
  setSaving(true);
  try {
    const res = await fetch("/api/workouts", { method: "POST", ... });
    if (!res.ok) {
      const body = await res.json();
      // show body.error or body.errors
      return;
    }
    await loadWorkouts(); // refresh list
  } finally {
    setSaving(false);
  }
}
```

## The bar for this stage

Your list page handles all four fetch states. Your create form handles submitting and server validation errors. That's what "solid UI" means at this level — not animations or design awards.
