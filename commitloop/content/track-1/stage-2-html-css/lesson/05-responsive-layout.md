## One HTML file, two viewport experiences

Your app shell must work on a **desktop** monitor and a **phone-width** screen. You don't maintain two codebases — you write one layout that **adapts** with CSS.

## Viewport meta tag

Without this, mobile browsers zoom out to fake a desktop width:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Put it in `<head>` on every page.

## Media queries

A **media query** applies rules only when a condition matches — usually viewport width:

```css
/* base: mobile-first (narrow default) */
.app-header {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
}

.card-grid {
  flex-direction: column;
}

/* tablet and up */
@media (min-width: 600px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .card-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* desktop */
@media (min-width: 900px) {
  main {
    max-width: 960px;
    margin: 0 auto;
  }
}
```

**Mobile-first** means default styles target narrow screens; `min-width` queries **add** complexity as space grows.

## Practical breakpoints

| Breakpoint | Typical use |
| --- | --- |
| `600px` | Stack → row header; cards side by side |
| `900px` | Constrain content width, more padding |

Don't chase device pixels. Resize in DevTools device toolbar (375px, 768px, 1280px) and fix what actually breaks.

## Touch-friendly targets

On narrow screens, tap targets need breathing room:

```css
nav a {
  display: inline-block;
  padding: var(--space-sm) var(--space-md);
}
```

## Hiding vs restructuring

Prefer **restructuring** (column → row) over `display: none` on important content. Navigation might collapse to a vertical list on mobile — still there, still semantic.

## Validate the shell

Checklist before you commit:

1. **375px** — header readable, no horizontal scroll, footer visible.
2. **1280px** — content centered or full-width by design, not stretched awkwardly.
3. **Elements panel** — `<main>` still wraps primary content; flex overlays look intentional.

This stage ships **static** HTML/CSS only. Stage 3 wires JavaScript into the same shell — get the layout right now so you don't rework it later.
