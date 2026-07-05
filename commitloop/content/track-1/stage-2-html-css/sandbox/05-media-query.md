Add a mobile-first breakpoint.

```css
/* default: narrow */
.app-header {
  flex-direction: column;
  align-items: flex-start;
}

/* wider screens */
@media (min-width: 600px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
```

Open DevTools → toggle **device toolbar** (Cmd+Shift+M). Drag the width:

- **Below 600px** — title and nav stack vertically.
- **Above 600px** — they sit on one row.

No horizontal scrollbar at 375px width. If content overflows, check for fixed widths or missing `flex-wrap`.
