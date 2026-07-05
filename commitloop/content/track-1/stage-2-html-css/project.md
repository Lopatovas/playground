Build the static **app shell** for your Track 1 project in `web/`. No JavaScript yet — layout and structure only.

## 1. File layout

```text
web/
  index.html
  styles.css
```

Serve locally with any static server, or open `index.html` in Chrome for now:

```bash
cd web
npx serve .   # optional — any static server works
```

## 2. Semantic shell

`index.html` must include:

- `<header>` with your app name and `<nav>` links (placeholders like `#list`, `#add` are fine)
- `<main id="app">` with at least one `<section>` for your primary view
- `<footer>` with a short line of credit
- Viewport meta tag in `<head>`

## 3. Flexbox layout

- Body uses column flex so footer sits at the bottom on short pages (`min-height: 100vh`, `main { flex: 1 }`).
- Header uses row flex on wide screens (`space-between` title and nav).
- A `.card-grid` or list area uses flex with `wrap` for future items.

## 4. CSS variables

Define tokens on `:root` — at minimum background, surface, text, accent, spacing, and border radius. Use `var()` throughout; no random hex in component rules.

## 5. Responsive breakpoint

Mobile-first base styles, then at least one `@media (min-width: 600px)` block that changes header or grid layout.

## 6. Validate in DevTools

Before committing:

1. Elements — tree reads `header → main → section → footer`, not div soup.
2. Device toolbar at **375px** — no horizontal scroll; tap targets have padding.
3. **1280px** — layout looks intentional (centered `max-width` on `main` is a good choice).

## 7. Commit

```bash
git add web/
git commit -m "feat: add responsive static app shell"
git push
```

## Outcome

`web/` contains a polished static shell that looks like a real app on desktop and phone-width. Stage 3 adds JavaScript into this structure — you won't redo layout.
