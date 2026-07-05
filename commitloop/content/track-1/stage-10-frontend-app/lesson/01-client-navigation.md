## One HTML file, many views

Track 1 uses **vanilla JavaScript** — no React Router, no Vue. You still need an app that *feels* like multiple pages: list, add form, settings, login.

Three common patterns:

| Pattern | How it works | Pros |
| --- | --- | --- |
| **Show/hide sections** | All views in one HTML file; JS toggles `hidden` or `display` | Simplest start |
| **Hash routes** | `#/list`, `#/settings`; `hashchange` event loads view | Bookmarkable URLs |
| **Multi-page** | Separate HTML files (`list.html`, `login.html`) | Works without JS routing |

Pick one and stay consistent. Show/hide or hash routes are typical for Track 1.

## Show/hide example

```html
<main id="view-login" class="view">…</main>
<main id="view-app" class="view hidden">…</main>
```

```javascript
function showView(name) {
  document.querySelectorAll(".view").forEach((el) => el.classList.add("hidden"));
  document.getElementById(`view-${name}`).classList.remove("hidden");
}
```

## App shell structure

```text
index.html
├── view-login
├── view-register
└── view-app
    ├── nav (List | Add | Settings | Logout)
    └── content area (swap list vs form vs settings)
```

Keep **navigation logic** in one module (`nav.js` or top of `app.js`). Keep **render functions** separate (`renderList`, `renderForm`).

## Why this before fetch complexity?

Clear navigation makes auth gating obvious: unauthenticated users never see `#view-app`. Authenticated users never see `#view-login` unless they log out.

Stage 2 taught render-after-data-change. Stage 10 adds **which screen** is visible — same DOM skills, bigger app.
