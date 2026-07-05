## Layout without tables or magic numbers

Before flexbox, centering and side-by-side columns were painful. **Flexbox** is a one-dimensional layout system: you declare a **flex container**, and its **children** align along a main axis.

## Turn on flex

```css
.app-header {
  display: flex;
  align-items: center;   /* cross-axis: vertical center in a row */
  justify-content: space-between; /* main-axis: title left, nav right */
  gap: 1rem;
  padding: 1rem 1.5rem;
}
```

| Property | What it controls |
| --- | --- |
| `display: flex` | Children become flex items in a row (by default) |
| `flex-direction` | `row` (default) or `column` |
| `justify-content` | Distribution along the **main** axis |
| `align-items` | Alignment along the **cross** axis |
| `gap` | Space between items |

## Column layout for the shell

Stack header, main, and footer vertically on the body:

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
}

main {
  flex: 1; /* grow to fill remaining viewport height */
  padding: 1.5rem;
}
```

`flex: 1` on `<main>` pushes the footer to the bottom when content is short — a common app-shell pattern.

## Card row that wraps

Inside `<main>`, a list of cards can wrap on narrow screens:

```css
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 280px; /* grow, shrink, basis ~280px */
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
```

`flex-wrap: wrap` lets items drop to the next line instead of overflowing.

## Common justify values

| Value | Effect |
| --- | --- |
| `flex-start` | Pack items at the start |
| `center` | Center along main axis |
| `space-between` | First at start, last at end, space between |
| `space-around` | Equal space around each item |

## Debug in DevTools

Select a flex container in Elements. Chrome shows **flex overlay** badges (toggle "Flex" in the Layout section). When items sit in the wrong place, check:

1. Is `display: flex` on the **parent**, not the child?
2. Is `flex-direction` what you expect?
3. Does a child have a fixed width fighting `flex: 1`?

Fix in DevTools first, then copy the working values into `styles.css`.
