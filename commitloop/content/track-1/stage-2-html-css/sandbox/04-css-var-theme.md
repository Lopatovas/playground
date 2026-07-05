Centralize colors in `:root`.

```css
:root {
  --bg: #111;
  --text: #eee;
  --accent: #5b9bd5;
}

body {
  background: var(--bg);
  color: var(--text);
}

button {
  background: var(--accent);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
}
```

In DevTools, select `<html>` or `:root` in the Styles pane. Change `--accent` to another color — every `button` updates. That's the payoff of variables.

Move these declarations into your scratch `styles.css` and confirm the file reload still works.
