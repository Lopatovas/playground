Make a header bar with title left and nav right.

```css
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}
```

```html
<header class="app-header">
  <h1>My App</h1>
  <nav>
    <a href="#list">List</a>
    <a href="#add">Add</a>
  </nav>
</header>
```

In DevTools, select `.app-header` and enable the **flex** overlay. Confirm:

- Main axis is **horizontal** (`flex-direction: row` is default).
- `space-between` pushes `h1` and `nav` to opposite edges.

Now add `flex-direction: column` temporarily in DevTools. Items stack — that's the cross-layout trick you'll use in the responsive lesson.
