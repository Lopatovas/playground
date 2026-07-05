## UI reflects permissions

Stage 9 added `role` to JWT claims and `/me`. Stage 10 uses it in the DOM.

```javascript
let currentUser = null; // { id, email, role }

function renderApp() {
  renderNav();
  renderList();
  if (currentUser.role === "admin") {
    renderAdminPanel();
  }
}
```

## Hide, don't merely disable

Bad: admin button always in HTML, `disabled` for non-admins (still visible, confusing).

Good: only append admin UI when `role === 'admin'`:

```javascript
function renderNav() {
  nav.innerHTML = `
    <a href="#/list">List</a>
    <a href="#/add">Add</a>
    ${currentUser.role === "admin" ? '<a href="#/admin">Admin</a>' : ""}
    <button id="logout">Logout</button>
  `;
}
```

## API is the real enforcement

UI hiding is **UX**, not security. A user can always curl your admin endpoint. The API's `requireRole('admin')` returns **403** — that must stay.

Test both layers:

1. UI: log in as `user` → no admin link
2. API: curl admin route with user's token → 403

## Owner vs admin

Two authorization ideas:

| Check | Example |
| --- | --- |
| **Role** | Only `admin` sees site-wide stats |
| **Ownership** | User can edit only their own workouts |

Ownership is enforced on the API (`workout.user_id === req.user.sub`). The UI can hide edit/delete on rows that aren't yours — fetch scoped lists from Stage 7 so users only see their data anyway.

## Display role in settings

Settings view: show email and role (read-only). Helps debugging and demoing RBAC to reviewers.
