## One place to change the theme

Hard-coded hex values scatter across a stylesheet:

```css
/* painful to re-theme */
.header { background: #1a1a2e; color: #eee; }
.card { border-color: #333; }
button { background: #4a90d9; }
```

**CSS custom properties** (variables) centralize those values. Change `--color-accent` once and every rule using it updates.

## Declaring variables

Define them on `:root` so they're global:

```css
:root {
  --color-bg: #0f0f14;
  --color-surface: #1a1a24;
  --color-text: #e8e8ec;
  --color-muted: #888;
  --color-accent: #4a90d9;
  --color-border: #2a2a36;

  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;

  --radius: 8px;
  --font-sans: system-ui, sans-serif;
}
```

## Using variables

Reference with `var()`:

```css
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-md) var(--space-lg);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-md);
}

button[type="submit"] {
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: var(--space-sm) var(--space-md);
}
```

## Fallback values

```css
color: var(--color-text, #111);
```

If `--color-text` is missing, `#111` applies. Useful during incremental refactors.

## Scoping variables

Variables inherit. You can override on a subtree:

```css
.card--highlight {
  --color-surface: #252535;
}
```

Only `.card--highlight` and its descendants see the new surface color.

## Why this matters for your project

Stage 3 adds JavaScript; Stage 10 adds auth screens. A token set in `:root` keeps the app visually consistent without hunting hex codes. DevTools shows computed values — select `:root` in Elements and confirm your variables resolve.

## Minimal token set for Track 1

You don't need fifty variables. Start with:

- 3–4 **colors** (bg, surface, text, accent)
- 3 **spacing** steps
- 1 **radius**

Expand when you feel repetition, not before.
